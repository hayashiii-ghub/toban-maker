# toban-maker（当番表メーカー）

## Overview
掃除当番・給食当番・日直などのローテーション表を作成・印刷・共有できるWebアプリ。

## Stack
- **Frontend**: React SPA (Vite, wouter, Tailwind CSS v4, Framer Motion, shadcn/ui)
- **Backend**: Hono on Cloudflare Pages Functions
- **Database**: Cloudflare D1 (SQLite) with Drizzle ORM
- **Auth**: Edit token (no user auth) — URL + token controls view/edit access

## Directory Structure
```
client/           # React SPA source
  src/
    rotation/     # Core types, utils, constants, default state
    features/     # Feature components (home/)
    pages/        # Page components
    lib/          # API client, utilities
    components/   # Shared UI components (shadcn/ui)
server/           # Hono API
  worker.ts       # Cloudflare Workers entry point
  api.ts          # Hono API app definition
  routes/         # API route handlers
  db/             # Drizzle schema & migrations
shared/           # Shared TypeScript types (frontend & backend)
functions/        # Cloudflare Pages Functions entry point
```

## Development Commands
```bash
pnpm dev          # Vite dev server (port 3000)
pnpm dev:api      # Wrangler Pages dev server (port 8788)
pnpm dev:full     # Both in parallel
pnpm build        # Production build
pnpm check        # TypeScript type check
```

## Philosophy
- **目的**: 印刷/PDFベースできれいな当番表を、様々なパターンで簡単に作成・管理する
- **シンプルさ最優先** — 編集要素をむやみに増やさない。機能よりわかりやすさを優先
- **軽量** — 重いDB不要。localStorageが主データストア、D1はクラウド永続化層
- **印刷品質** — 印刷/PDF出力がきれいであることが最重要価値
- **ターゲットユーザー**: 教師・PTA等の非技術者
- **やらないこと**: 通知・リマインダー / 変更履歴・監査ログ / リアルタイム共同編集 / 交代リクエスト / メンバー検索 / 公平性ダッシュボード / Undo / 印刷プレビューモーダル（ブラウザの印刷ダイアログで十分）

## Key Conventions
- Types shared between client/server live in `shared/types.ts`
- Client imports shared types via `@shared/*` alias
- Client internal imports use `@/*` alias
- localStorage is the primary data store; D1 is the cloud persistence layer
- Japanese UI — all user-facing strings are in Japanese
