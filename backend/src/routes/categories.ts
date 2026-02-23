import { Hono } from "hono";
import pool from "../db/pool.js";

const categories = new Hono();

// GET /api/categories
categories.get("/", async (c) => {
  const result = await pool.query(
    "SELECT id, name, description FROM categories ORDER BY name"
  );
  return c.json(result.rows);
});

export default categories;
