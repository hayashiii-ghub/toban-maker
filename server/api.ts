import { Hono } from "hono";
import { cors } from "hono/cors";
import { bodyLimit } from "hono/body-limit";
import scheduleRoutes from "./routes/schedules";

type Env = { Bindings: { DB: D1Database } };

const app = new Hono<Env>();

// CORS: 本番ドメイン + 開発用localhost
app.use(
  "/api/*",
  cors({
    origin: [
      "https://toban-maker.pages.dev",
      "http://localhost:3000",
      "http://localhost:8788",
    ],
  }),
);

// リクエストボディサイズ制限: 100KB
app.use("/api/*", bodyLimit({ maxSize: 100 * 1024 }));

// メモリベース簡易レート制限（Workerインスタンス単位）
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function getRateLimitKey(ip: string, method: string): string {
  return `${ip}:${method}`;
}

function getMaxRequests(method: string): number {
  if (method === "POST") return 10;
  if (method === "PUT" || method === "DELETE") return 20;
  return 60; // GET
}

app.use("/api/*", async (c, next) => {
  const ip = c.req.header("cf-connecting-ip") ?? c.req.header("x-forwarded-for") ?? "unknown";
  const method = c.req.method;
  const key = getRateLimitKey(ip, method);
  const now = Date.now();
  const maxRequests = getMaxRequests(method);

  let entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + 60_000 };
    rateLimitMap.set(key, entry);
  }

  entry.count++;

  if (entry.count > maxRequests) {
    return c.json({ error: "Too many requests" }, 429);
  }

  await next();
});

app.route("/api/schedules", scheduleRoutes);

export default app;
