import { Hono } from "hono";
import bcrypt from "bcryptjs";
import pool from "../db/pool.js";
import { authMiddleware, requireRole } from "../middleware/auth.js";
import type { AppEnv } from "../types.js";

const users = new Hono<AppEnv>();

users.use("/*", authMiddleware());

// GET /api/users - ユーザー一覧（admin のみ）
users.get("/", requireRole("admin"), async (c) => {
  const result = await pool.query(
    "SELECT id, email, name, role, created_at FROM users ORDER BY created_at DESC"
  );
  return c.json(result.rows);
});

// POST /api/users - ユーザー登録（admin のみ）
users.post("/", requireRole("admin"), async (c) => {
  const body = await c.req.json();
  const { email, password, name, role } = body;

  if (!email || !password || !name || !role) {
    return c.json({ error: "全項目を入力してください" }, 400);
  }

  if (password.length < 8) {
    return c.json({ error: "パスワードは8文字以上で設定してください" }, 400);
  }

  const validRoles = ["learner", "creator", "reviewer", "admin"];
  if (!validRoles.includes(role)) {
    return c.json({ error: "無効なロールです" }, 400);
  }

  const hash = await bcrypt.hash(password, 10);

  try {
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, name, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, name, role, created_at`,
      [email, hash, name, role]
    );
    return c.json(result.rows[0], 201);
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && (err as { code: string }).code === "23505") {
      return c.json({ error: "このメールアドレスは既に登録されています" }, 409);
    }
    throw err;
  }
});

// PUT /api/users/:id/role - ロール変更（admin のみ）
users.put("/:id/role", requireRole("admin"), async (c) => {
  const user = c.get("user");
  const targetId = c.req.param("id");
  const body = await c.req.json();
  const { role } = body;

  // 自分自身のロール変更は禁止
  if (String(user.userId) === targetId) {
    return c.json({ error: "自分自身のロールは変更できません" }, 400);
  }

  const validRoles = ["learner", "creator", "reviewer", "admin"];
  if (!validRoles.includes(role)) {
    return c.json({ error: "無効なロールです" }, 400);
  }

  const result = await pool.query(
    "UPDATE users SET role = $1 WHERE id = $2 RETURNING id, email, name, role",
    [role, targetId]
  );

  if (result.rows.length === 0) {
    return c.json({ error: "ユーザーが見つかりません" }, 404);
  }

  return c.json(result.rows[0]);
});

export default users;
