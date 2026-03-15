import app from "./api";
import { drizzle } from "drizzle-orm/d1";
import { lt } from "drizzle-orm";
import { schedules } from "./db/schema";

interface Env {
  ASSETS: { fetch: typeof fetch };
  DB: D1Database;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/")) {
      return app.fetch(request, env, ctx);
    }
    return env.ASSETS.fetch(request);
  },

  async scheduled(_event: ScheduledEvent, env: Env, _ctx: ExecutionContext) {
    // 90日以上前のレコードを削除
    const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    const db = drizzle(env.DB);
    await db.delete(schedules).where(lt(schedules.updatedAt, cutoff));
  },
};
