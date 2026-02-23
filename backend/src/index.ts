import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import auth from "./routes/auth.js";
import categories from "./routes/categories.js";
import quizzes from "./routes/quizzes.js";
import users from "./routes/users.js";
import dashboard from "./routes/dashboard.js";
import generate from "./routes/generate.js";
import floorPlans from "./routes/floorPlans.js";

const app = new Hono();

app.use("/*", cors({
  origin: ["http://localhost:5173", "http://localhost:5175", "http://localhost:3004"],
  credentials: true,
}));

// Health check
app.get("/api/health", (c) => c.json({ status: "ok" }));

// Routes
app.route("/api/auth", auth);
app.route("/api/categories", categories);
app.route("/api/quizzes", quizzes);
app.route("/api/users", users);
app.route("/api/dashboard", dashboard);
app.route("/api/quizzes/generate", generate);
app.route("/api/floor-plans", floorPlans);

const port = parseInt(process.env.PORT || "3004", 10);

serve({ fetch: app.fetch, port }, () => {
  console.log(`LabQuiz backend running on http://localhost:${port}`);
});

export default app;
