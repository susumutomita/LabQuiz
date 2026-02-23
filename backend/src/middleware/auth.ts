import { createMiddleware } from "hono/factory";
import jwt from "jsonwebtoken";
import type { AppEnv } from "../types.js";

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is required");
  }
  return secret;
}

const JWT_SECRET = getJwtSecret();

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

export const authMiddleware = () =>
  createMiddleware<AppEnv>(async (c, next) => {
    const header = c.req.header("Authorization");
    if (!header?.startsWith("Bearer ")) {
      return c.json({ error: "認証が必要です" }, 401);
    }
    const token = header.slice(7);
    try {
      const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
      c.set("user", payload);
      await next();
    } catch {
      return c.json({ error: "無効なトークンです" }, 401);
    }
  });

export const requireRole = (...roles: string[]) =>
  createMiddleware<AppEnv>(async (c, next) => {
    const user = c.get("user");
    if (!user) {
      return c.json({ error: "認証が必要です" }, 401);
    }
    if (!roles.includes(user.role)) {
      return c.json({ error: "権限がありません" }, 403);
    }
    await next();
  });

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });
}
