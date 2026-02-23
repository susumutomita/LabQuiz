import pg from "pg";

const pool = new pg.Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgresql://labquiz:labquiz_dev@localhost:5432/labquiz",
});

export default pool;
