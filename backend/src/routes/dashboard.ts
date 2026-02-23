import { Hono } from "hono";
import pool from "../db/pool.js";
import { authMiddleware, requireRole } from "../middleware/auth.js";
import type { AppEnv } from "../types.js";

const dashboard = new Hono<AppEnv>();

dashboard.use("/*", authMiddleware());
dashboard.use("/*", requireRole("admin"));

// GET /api/dashboard/progress - 全ユーザーのカテゴリ別進捗
dashboard.get("/progress", async (c) => {
  const result = await pool.query(`
    SELECT
      u.id as user_id,
      u.name as user_name,
      u.email,
      c.id as category_id,
      c.name as category_name,
      COUNT(qa.id) as total_answers,
      COUNT(CASE WHEN qa.is_correct THEN 1 END) as correct_answers,
      COUNT(DISTINCT qa.session_id) as session_count,
      MAX(qa.answered_at) as last_answered_at,
      CASE WHEN b.id IS NOT NULL THEN true ELSE false END as has_badge
    FROM users u
    CROSS JOIN categories c
    LEFT JOIN quiz_answers qa ON qa.user_id = u.id
      AND qa.quiz_id IN (SELECT id FROM quizzes WHERE category_id = c.id)
    LEFT JOIN badges b ON b.user_id = u.id AND b.category_id = c.id
    WHERE u.role = 'learner'
    GROUP BY u.id, u.name, u.email, c.id, c.name, b.id
    ORDER BY u.name, c.name
  `);

  // ユーザーごとにグループ化
  const usersMap = new Map<string, {
    userId: string;
    name: string;
    email: string;
    categories: Array<{
      categoryId: string;
      categoryName: string;
      totalAnswers: number;
      correctAnswers: number;
      accuracy: number;
      sessionCount: number;
      lastAnsweredAt: string | null;
      hasBadge: boolean;
      isWarning: boolean;
    }>;
  }>();

  for (const row of result.rows) {
    if (!usersMap.has(row.user_id)) {
      usersMap.set(row.user_id, {
        userId: row.user_id,
        name: row.user_name,
        email: row.email,
        categories: [],
      });
    }

    const total = parseInt(row.total_answers);
    const correct = parseInt(row.correct_answers);
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

    usersMap.get(row.user_id)!.categories.push({
      categoryId: row.category_id,
      categoryName: row.category_name,
      totalAnswers: total,
      correctAnswers: correct,
      accuracy,
      sessionCount: parseInt(row.session_count),
      lastAnsweredAt: row.last_answered_at,
      hasBadge: row.has_badge,
      isWarning: total > 0 && accuracy < 70,
    });
  }

  return c.json(Array.from(usersMap.values()));
});

// GET /api/dashboard/export - CSV エクスポート
dashboard.get("/export", async (c) => {
  const result = await pool.query(`
    SELECT
      u.name as user_name,
      u.email,
      c.name as category_name,
      COUNT(qa.id) as total_answers,
      COUNT(CASE WHEN qa.is_correct THEN 1 END) as correct_answers,
      COUNT(DISTINCT qa.session_id) as session_count,
      MAX(qa.answered_at) as last_answered_at
    FROM users u
    CROSS JOIN categories c
    LEFT JOIN quiz_answers qa ON qa.user_id = u.id
      AND qa.quiz_id IN (SELECT id FROM quizzes WHERE category_id = c.id)
    WHERE u.role = 'learner'
    GROUP BY u.name, u.email, c.name
    ORDER BY u.name, c.name
  `);

  const header = "氏名,メール,カテゴリ,回答数,正答数,正答率(%),受験回数,最終受験日\n";
  const rows = result.rows.map((r) => {
    const total = parseInt(r.total_answers);
    const correct = parseInt(r.correct_answers);
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
    return `${r.user_name},${r.email},${r.category_name},${total},${correct},${accuracy},${r.session_count},${r.last_answered_at || "未受験"}`;
  });

  const csv = header + rows.join("\n");
  c.header("Content-Type", "text/csv; charset=utf-8");
  c.header("Content-Disposition", "attachment; filename=progress.csv");
  return c.body("\uFEFF" + csv); // BOM付きUTF-8
});

export default dashboard;
