import { Hono } from "hono";
import pool from "../db/pool.js";
import { authMiddleware, requireRole } from "../middleware/auth.js";
import type { AppEnv } from "../types.js";
import crypto from "crypto";

const quizzes = new Hono<AppEnv>();

quizzes.use("/*", authMiddleware());

// GET /api/quizzes?category=UUID&count=10
// 承認済みクイズをランダムに取得
quizzes.get("/", async (c) => {
  const categoryId = c.req.query("category");
  const count = parseInt(c.req.query("count") || "10", 10);

  let query: string;
  let params: unknown[];

  if (categoryId) {
    query = `
      SELECT id, category_id, question, choices, correct_choice_id, explanation, floor_plan_zone_id
      FROM quizzes
      WHERE status = 'approved' AND category_id = $1
      ORDER BY RANDOM()
      LIMIT $2
    `;
    params = [categoryId, count];
  } else {
    query = `
      SELECT id, category_id, question, choices, correct_choice_id, explanation, floor_plan_zone_id
      FROM quizzes
      WHERE status = 'approved'
      ORDER BY RANDOM()
      LIMIT $1
    `;
    params = [count];
  }

  const result = await pool.query(query, params);

  if (result.rows.length === 0) {
    return c.json({
      quizzes: [],
      message: "このカテゴリにはまだ問題がありません",
    });
  }

  // セッションIDを生成
  const sessionId = crypto.randomUUID();

  // 2択に絞る: 正解 + ランダム不正解1つ → シャッフル
  const quizzesForClient = result.rows.map((q) => {
    const allChoices = q.choices as Array<{ id: string; text: string }>;
    const correct = allChoices.find((ch) => ch.id === q.correct_choice_id);
    const wrongs = allChoices.filter((ch) => ch.id !== q.correct_choice_id);
    if (!correct || wrongs.length === 0) {
      return null;
    }
    const randomWrong = wrongs[Math.floor(Math.random() * wrongs.length)]!;
    // シャッフル（50%の確率で順番入替）
    const twoChoices = Math.random() < 0.5 ? [correct, randomWrong] : [randomWrong, correct];
    return {
      id: q.id,
      categoryId: q.category_id,
      question: q.question,
      choices: twoChoices,
      floorPlanZoneId: q.floor_plan_zone_id,
    };
  }).filter(Boolean);

  return c.json({ sessionId, quizzes: quizzesForClient });
});

// POST /api/quizzes/:quizId/answer
quizzes.post("/:quizId/answer", async (c) => {
  const user = c.get("user");
  const quizId = c.req.param("quizId");
  const body = await c.req.json();
  const { choiceId, sessionId } = body;

  if (!choiceId || !sessionId) {
    return c.json({ error: "choiceIdとsessionIdは必須です" }, 400);
  }

  // クイズの正答を取得
  const quizResult = await pool.query(
    "SELECT correct_choice_id, explanation, choices FROM quizzes WHERE id = $1 AND status = 'approved'",
    [quizId]
  );

  if (quizResult.rows.length === 0) {
    return c.json({ error: "クイズが見つかりません" }, 404);
  }

  const quiz = quizResult.rows[0];

  // 選択肢IDの存在チェック
  const choices = quiz.choices as Array<{ id: string; text: string }>;
  if (!choices.some((ch) => ch.id === choiceId)) {
    return c.json({ error: "無効な選択肢IDです" }, 400);
  }

  const isCorrect = choiceId === quiz.correct_choice_id;

  // 重複回答チェック
  const existing = await pool.query(
    "SELECT 1 FROM quiz_answers WHERE user_id = $1 AND quiz_id = $2 AND session_id = $3",
    [user.userId, quizId, sessionId]
  );
  if (existing.rows.length > 0) {
    return c.json({ error: "この問題には既に回答済みです" }, 409);
  }

  // 回答を保存
  await pool.query(
    `INSERT INTO quiz_answers (user_id, quiz_id, session_id, choice_id, is_correct)
     VALUES ($1, $2, $3, $4, $5)`,
    [user.userId, quizId, sessionId, choiceId, isCorrect]
  );

  return c.json({
    isCorrect,
    correctChoiceId: quiz.correct_choice_id,
    explanation: quiz.explanation,
  });
});

// POST /api/quizzes/sessions/:sessionId/complete
// セッション完了＋バッジ判定
quizzes.post("/sessions/:sessionId/complete", async (c) => {
  const user = c.get("user");
  const sessionId = c.req.param("sessionId");

  // セッション内の全回答を取得
  const answers = await pool.query(
    `SELECT qa.is_correct, q.category_id
     FROM quiz_answers qa
     JOIN quizzes q ON q.id = qa.quiz_id
     WHERE qa.session_id = $1 AND qa.user_id = $2`,
    [sessionId, user.userId]
  );

  if (answers.rows.length === 0) {
    return c.json({ error: "セッションが見つかりません" }, 404);
  }

  const total = answers.rows.length;
  const correct = answers.rows.filter((a) => a.is_correct).length;
  const categoryId = answers.rows[0].category_id;
  const isPerfect = total === correct && total > 0;

  let badgeEarned = false;

  // 満点の場合、バッジを付与
  if (isPerfect) {
    const insertResult = await pool.query(
      `INSERT INTO badges (user_id, category_id) VALUES ($1, $2)
       ON CONFLICT (user_id, category_id) DO NOTHING
       RETURNING id`,
      [user.userId, categoryId]
    );
    badgeEarned = insertResult.rows.length > 0;
  }

  return c.json({
    sessionId,
    total,
    correct,
    score: Math.round((correct / total) * 100),
    isPerfect,
    badgeEarned,
  });
});

// PUT /api/quizzes/:quizId/review
// 専門家がクイズを承認/修正/却下
quizzes.put(
  "/:quizId/review",
  requireRole("reviewer", "admin"),
  async (c) => {
    const user = c.get("user");
    const quizId = c.req.param("quizId");
    const body = await c.req.json();
    const { action, question, choices, correctChoiceId, explanation, updatedAt } = body;

    if (!action || !["approve", "reject", "edit"].includes(action)) {
      return c.json({ error: "actionはapprove/reject/editのいずれかです" }, 400);
    }

    // 楽観的ロック: updatedAtチェック
    const current = await pool.query(
      "SELECT updated_at, status FROM quizzes WHERE id = $1",
      [quizId]
    );

    if (current.rows.length === 0) {
      return c.json({ error: "クイズが見つかりません" }, 404);
    }

    if (updatedAt && current.rows[0].updated_at.toISOString() !== updatedAt) {
      return c.json({ error: "他のユーザーが既に更新しています。画面を再読み込みしてください" }, 409);
    }

    let status: string;
    if (action === "approve") status = "approved";
    else if (action === "reject") status = "rejected";
    else status = "pending"; // edit = 修正後は再レビュー待ち

    const updateFields: string[] = [
      "status = $1",
      "reviewed_by = $2",
      "updated_at = NOW()",
    ];
    const params: unknown[] = [status, user.userId];
    let paramIndex = 3;

    if (action === "edit") {
      if (question) {
        updateFields.push(`question = $${paramIndex++}`);
        params.push(question);
      }
      if (choices) {
        updateFields.push(`choices = $${paramIndex++}`);
        params.push(JSON.stringify(choices));
      }
      if (correctChoiceId) {
        updateFields.push(`correct_choice_id = $${paramIndex++}`);
        params.push(correctChoiceId);
      }
      if (explanation) {
        updateFields.push(`explanation = $${paramIndex++}`);
        params.push(explanation);
      }
    }

    params.push(quizId);

    const result = await pool.query(
      `UPDATE quizzes SET ${updateFields.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
      params
    );

    return c.json(result.rows[0]);
  }
);

// GET /api/quizzes/pending - レビュー待ちクイズ一覧
quizzes.get(
  "/pending",
  requireRole("reviewer", "admin"),
  async (c) => {
    const result = await pool.query(
      `SELECT q.*, c.name as category_name, u.name as creator_name
       FROM quizzes q
       JOIN categories c ON c.id = q.category_id
       JOIN users u ON u.id = q.created_by
       WHERE q.status = 'pending'
       ORDER BY q.created_at DESC`
    );
    return c.json(result.rows);
  }
);

export default quizzes;
