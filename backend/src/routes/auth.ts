import { Hono } from "hono";
import bcrypt from "bcryptjs";
import pool from "../db/pool.js";
import { signToken } from "../middleware/auth.js";

const auth = new Hono();

// POST /api/auth/login
auth.post("/login", async (c) => {
  const body = await c.req.json();
  const { email, password } = body;

  if (!email || !password) {
    return c.json({ error: "メールアドレスとパスワードを入力してください" }, 400);
  }

  const result = await pool.query(
    "SELECT id, email, password_hash, name, role FROM users WHERE email = $1",
    [email]
  );

  if (result.rows.length === 0) {
    return c.json({ error: "メールアドレスまたはパスワードが違います" }, 401);
  }

  const user = result.rows[0];
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return c.json({ error: "メールアドレスまたはパスワードが違います" }, 401);
  }

  const token = signToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  return c.json({
    token,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  });
});

export default auth;
