import { Hono } from "hono";
import pool from "../db/pool.js";
import { authMiddleware, requireRole } from "../middleware/auth.js";
import type { AppEnv } from "../types.js";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import crypto from "crypto";

const floorPlans = new Hono<AppEnv>();

floorPlans.use("/*", authMiddleware());

function getS3Client() {
  const accessKeyId = process.env.S3_ACCESS_KEY;
  const secretAccessKey = process.env.S3_SECRET_KEY;
  if (!accessKeyId || !secretAccessKey) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("S3 credentials are not configured");
    }
  }
  return new S3Client({
    endpoint: process.env.S3_ENDPOINT || "http://localhost:9000",
    region: "us-east-1",
    credentials: {
      accessKeyId: accessKeyId || "minioadmin",
      secretAccessKey: secretAccessKey || "minioadmin",
    },
    forcePathStyle: true,
  });
}

// POST /api/floor-plans - 平面図アップロード
floorPlans.post("/", requireRole("admin"), async (c) => {
  const user = c.get("user");
  const formData = await c.req.formData();
  const file = formData.get("image") as File | null;

  if (!file) {
    return c.json({ error: "画像ファイルをアップロードしてください" }, 400);
  }

  const allowedTypes = ["image/png", "image/jpeg", "image/gif", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return c.json({ error: "PNG, JPEG, GIF, WebP画像のみアップロード可能です" }, 400);
  }

  if (file.size > 10 * 1024 * 1024) {
    return c.json({ error: "ファイルサイズは10MB以下にしてください" }, 400);
  }

  const ext = file.name.split(".").pop() || "png";
  const key = `floor-plans/${crypto.randomUUID()}.${ext}`;
  const bucket = process.env.S3_BUCKET || "labquiz-uploads";

  const s3 = getS3Client();
  const buffer = Buffer.from(await file.arrayBuffer());

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    })
  );

  const imageUrl = `${process.env.S3_ENDPOINT || "http://localhost:9000"}/${bucket}/${key}`;

  const result = await pool.query(
    `INSERT INTO floor_plans (image_url, zones, created_by)
     VALUES ($1, '[]', $2)
     RETURNING *`,
    [imageUrl, user.userId]
  );

  return c.json(result.rows[0], 201);
});

// GET /api/floor-plans - 平面図一覧
floorPlans.get("/", async (c) => {
  const result = await pool.query(
    "SELECT * FROM floor_plans ORDER BY created_at DESC"
  );
  return c.json(result.rows);
});

// PUT /api/floor-plans/:id/zones - ゾーン更新
floorPlans.put("/:id/zones", requireRole("admin"), async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const { zones } = body;

  if (!Array.isArray(zones)) {
    return c.json({ error: "zonesは配列で指定してください" }, 400);
  }

  const result = await pool.query(
    "UPDATE floor_plans SET zones = $1 WHERE id = $2 RETURNING *",
    [JSON.stringify(zones), id]
  );

  if (result.rows.length === 0) {
    return c.json({ error: "平面図が見つかりません" }, 404);
  }

  return c.json(result.rows[0]);
});

export default floorPlans;
