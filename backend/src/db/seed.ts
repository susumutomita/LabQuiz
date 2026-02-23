import bcrypt from "bcryptjs";
import pool from "./pool.js";

async function seed() {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@labquiz.local";
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    throw new Error("ADMIN_PASSWORD environment variable is required");
  }
  const client = await pool.connect();
  try {
    const hash = await bcrypt.hash(adminPassword, 10);

    // 管理者ユーザー作成
    await client.query(
      `INSERT INTO users (email, password_hash, name, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO NOTHING`,
      [adminEmail, hash, "管理者", "admin"]
    );

    console.log("Seed completed. Admin user created.");
  } catch (err) {
    console.error("Seed failed:", err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
