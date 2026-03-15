import app from "./api";
import { drizzle } from "drizzle-orm/d1";
import { eq, lt } from "drizzle-orm";
import { schedules } from "./db/schema";

interface Env {
  ASSETS: { fetch: typeof fetch };
  DB: D1Database;
}

const BOT_UA_PATTERN =
  /facebookexternalhit|Twitterbot|LinkedInBot|Line\/|Slackbot|Discordbot|Googlebot|bingbot|Applebot/i;

function isBot(ua: string): boolean {
  return BOT_UA_PATTERN.test(ua);
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function handleOgpRequest(
  url: URL,
  env: Env,
  slug: string,
): Promise<Response> {
  const db = drizzle(env.DB);
  const [schedule] = await db
    .select({ name: schedules.name })
    .from(schedules)
    .where(eq(schedules.slug, slug))
    .limit(1);

  if (!schedule) {
    return env.ASSETS.fetch(new Request(url.href));
  }

  const title = escapeHtml(schedule.name);
  const description = escapeHtml(`「${schedule.name}」の当番表`);
  const ogUrl = escapeHtml(url.href);

  // Fetch the SPA shell HTML
  const assetResponse = await env.ASSETS.fetch(new Request(`${url.origin}/`));
  let html = await assetResponse.text();

  // Inject OGP meta tags
  html = html.replace(
    /<title>[^<]*<\/title>/,
    `<title>${title} - 当番表メーカー</title>`,
  );

  const ogTags = [
    `<meta property="og:title" content="${title} - 当番表メーカー" />`,
    `<meta property="og:description" content="${description}" />`,
    `<meta property="og:url" content="${ogUrl}" />`,
    `<meta property="og:type" content="website" />`,
  ].join("\n    ");

  html = html.replace("</head>", `    ${ogTags}\n  </head>`);

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/")) {
      return app.fetch(request, env, ctx);
    }

    // Dynamic OGP for bot crawlers on shared schedule pages
    const slugMatch = url.pathname.match(/^\/s\/([a-zA-Z0-9_-]+)$/);
    if (slugMatch) {
      const ua = request.headers.get("user-agent") ?? "";
      if (isBot(ua)) {
        return handleOgpRequest(url, env, slugMatch[1]);
      }
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
