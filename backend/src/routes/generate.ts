import { Hono } from "hono";
import pool from "../db/pool.js";
import { authMiddleware, requireRole } from "../middleware/auth.js";
import type { AppEnv } from "../types.js";
import OpenAI from "openai";

const generate = new Hono<AppEnv>();

generate.use("/*", authMiddleware());
generate.use("/*", requireRole("creator", "admin"));

// POST /api/quizzes/generate
generate.post("/", async (c) => {
  const user = c.get("user");
  const formData = await c.req.formData();
  const file = formData.get("file") as File | null;
  const categoryId = formData.get("categoryId") as string | null;
  const count = parseInt((formData.get("count") as string) || "5", 10);

  if (!file) {
    return c.json({ error: "ファイルをアップロードしてください" }, 400);
  }

  if (!categoryId) {
    return c.json({ error: "カテゴリを選択してください" }, 400);
  }

  // カテゴリの存在チェック
  const catResult = await pool.query("SELECT id, name FROM categories WHERE id = $1", [categoryId]);
  if (catResult.rows.length === 0) {
    return c.json({ error: "カテゴリが見つかりません" }, 404);
  }

  // ファイル内容を読み取り
  const text = await file.text();
  if (!text.trim()) {
    return c.json({ error: "ファイルが空です" }, 400);
  }

  // OpenAI APIでクイズ生成
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return c.json({ error: "AI機能は現在利用できません（API未設定）" }, 503);
  }

  const openai = new OpenAI({ apiKey });

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `あなたはバイオ系ラボの教育クイズ作成専門家です。
以下のマニュアル内容から、4択クイズを${count}問作成してください。
カテゴリ: ${catResult.rows[0].name}

各問題は以下のJSON形式で出力してください:
[
  {
    "question": "問題文",
    "choices": [
      {"id": "a", "text": "選択肢A"},
      {"id": "b", "text": "選択肢B"},
      {"id": "c", "text": "選択肢C"},
      {"id": "d", "text": "選択肢D"}
    ],
    "correctChoiceId": "正答の選択肢ID",
    "explanation": "解説文"
  }
]

ルール:
- 問題は実務に直結する具体的な内容にする
- 解説は学習効果を高める詳しい説明を含める
- 選択肢は紛らわしいが明確に区別可能なものにする
- JSON配列のみを出力し、それ以外のテキストは含めない`,
        },
        {
          role: "user",
          content: text.slice(0, 8000), // トークン制限対応
        },
      ],
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return c.json({ error: "問題を生成できませんでした。マニュアル内容を確認してください" }, 422);
    }

    let quizData: Array<{
      question: string;
      choices: Array<{ id: string; text: string }>;
      correctChoiceId: string;
      explanation: string;
    }>;

    try {
      quizData = JSON.parse(content);
    } catch {
      return c.json({ error: "AI生成結果のパースに失敗しました。再度お試しください" }, 422);
    }

    if (!Array.isArray(quizData) || quizData.length === 0) {
      return c.json({ error: "問題を生成できませんでした。マニュアル内容を確認してください" }, 422);
    }

    // DBに保存（トランザクション）
    const client = await pool.connect();
    const insertedQuizzes = [];
    try {
      await client.query("BEGIN");
      for (const q of quizData) {
        const result = await client.query(
          `INSERT INTO quizzes (category_id, question, choices, correct_choice_id, explanation, status, created_by)
           VALUES ($1, $2, $3, $4, $5, 'pending', $6)
           RETURNING *`,
          [categoryId, q.question, JSON.stringify(q.choices), q.correctChoiceId, q.explanation, user.userId]
        );
        insertedQuizzes.push(result.rows[0]);
      }
      await client.query("COMMIT");
    } catch (insertErr) {
      await client.query("ROLLBACK");
      throw insertErr;
    } finally {
      client.release();
    }

    return c.json({
      message: `${insertedQuizzes.length}問のクイズ候補を生成しました`,
      quizzes: insertedQuizzes,
    });
  } catch (err: unknown) {
    console.error("OpenAI API error:", err);
    return c.json({ error: "AI問題生成中にエラーが発生しました。しばらく後にお試しください" }, 503);
  }
});

export default generate;
