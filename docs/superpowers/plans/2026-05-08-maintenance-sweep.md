# メンテナンススイープ Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 壊れている Lighthouse CI を直し、Node.js 20 廃止に追従し、溜まった Dependabot PR を片付ける。

**Architecture:**
1. `dependabot.yml` を先に更新してグループ化を効かせる
2. Lighthouse CI 設定を `vite preview` 起動方式に変更
3. ワークフローの actions バージョンを最新（v6 系）に上げる
4. CI 緑の Dependabot PR を順次マージ、構成漏れの #27 は close → 次サイクルで再生成

**Tech Stack:** GitHub Actions, Lighthouse CI, Dependabot, Vite, pnpm

**Spec:** `docs/superpowers/specs/2026-05-08-maintenance-sweep-design.md`

---

## File Structure

| File | Action | 役割 |
|------|--------|------|
| `.github/dependabot.yml` | Modify | グループ化と github-actions ecosystem 追加 |
| `lighthouserc.json` | Modify | `staticDistDir` → `startServerCommand` |
| `.github/workflows/ci.yml` | Modify | actions のメジャーバージョン v4 → v6 |
| `.github/workflows/lighthouse.yml` | Modify | actions v4 → v6, lighthouse-ci-action v12 のままで OK |

---

## Task 1: Dependabot 設定にグループ化と github-actions を追加

**Why first:** これを先に入れることで、Task 4 で close する PR #27 が次サイクルで react+react-dom が同一 PR にまとめられて生成される。

**Files:**
- Modify: `.github/dependabot.yml`（全置換）

- [ ] **Step 1: 現状確認**

Run: `cat .github/dependabot.yml`

Expected: 既存の最小構成（npm only, weekly, no groups）が表示される。

- [ ] **Step 2: 新しい dependabot.yml を書く**

`.github/dependabot.yml` を以下に置き換え:

```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
    labels:
      - "dependencies"
    groups:
      react:
        patterns:
          - "react"
          - "react-dom"
          - "@types/react"
          - "@types/react-dom"
      dev-minor:
        dependency-type: "development"
        update-types:
          - "minor"
          - "patch"
      prod-minor:
        dependency-type: "production"
        update-types:
          - "minor"
          - "patch"

  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
    labels:
      - "dependencies"
```

- [ ] **Step 3: YAML 構文チェック**

Run: `python3 -c "import yaml; yaml.safe_load(open('.github/dependabot.yml'))" && echo OK`

Expected: `OK`（構文エラーなし）

- [ ] **Step 4: コミット**

```bash
git add .github/dependabot.yml
git commit -m "chore: Dependabot に group 化と github-actions ecosystem を追加"
```

---

## Task 2: Lighthouse CI を vite preview 配信に切り替え

**Files:**
- Modify: `lighthouserc.json`（全置換）

- [ ] **Step 1: 現状の lighthouserc を確認**

Run: `cat lighthouserc.json`

Expected: `staticDistDir: "./dist"` と相対 URL `["/", "/about", "/templates"]` が見える。これが 404 失敗の原因。

- [ ] **Step 2: lighthouserc.json を書き換える**

`lighthouserc.json` を以下に置き換え:

```json
{
  "ci": {
    "collect": {
      "startServerCommand": "pnpm preview",
      "url": [
        "http://localhost:4173/",
        "http://localhost:4173/about",
        "http://localhost:4173/templates"
      ],
      "numberOfRuns": 1,
      "settings": {
        "preset": "desktop",
        "locale": "ja"
      }
    },
    "assert": {
      "assertions": {
        "categories:performance": ["warn", { "minScore": 0.8 }],
        "categories:accessibility": ["error", { "minScore": 0.8 }],
        "categories:best-practices": ["warn", { "minScore": 0.8 }],
        "categories:seo": ["warn", { "minScore": 0.8 }]
      }
    },
    "upload": {
      "target": "temporary-public-storage"
    }
  }
}
```

ポイント:
- `staticDistDir` を削除し `startServerCommand: "pnpm preview"` に置換
- URL を完全修飾（`http://localhost:4173/...`）に変更。vite preview のデフォルトポートが 4173

- [ ] **Step 3: ローカル検証 — preview を起動して 3 URL が 200 を返すか確認**

`node_modules` がインストール済みであること（無ければ `pnpm install --frozen-lockfile` を先に実行）

Run（バックグラウンド起動）:
```bash
pnpm build && pnpm preview &
PREVIEW_PID=$!
sleep 3
for path in / /about /templates; do
  echo -n "$path: "
  curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:4173$path"
done
kill $PREVIEW_PID 2>/dev/null
```

Expected:
```
/: 200
/about: 200
/templates: 200
```

3 つとも 200 でなければ vite の SPA fallback が効いていない。`vite.config.ts` を確認。

- [ ] **Step 4: JSON 構文チェック**

Run: `python3 -c "import json; json.load(open('lighthouserc.json'))" && echo OK`

Expected: `OK`

- [ ] **Step 5: コミット**

```bash
git add lighthouserc.json
git commit -m "fix: Lighthouse CI を vite preview 配信に切り替え（SPA ルートの 404 を解消）"
```

---

## Task 3: GitHub Actions のバージョンを v6 系に更新

**Files:**
- Modify: `.github/workflows/ci.yml`
- Modify: `.github/workflows/lighthouse.yml`

最新版確認済み (2026-05-08): `actions/checkout@v6`, `actions/setup-node@v6`, `pnpm/action-setup@v6`, `treosh/lighthouse-ci-action@v12`（v12.6.2 が最新だがタグ参照のままで OK）。

- [ ] **Step 1: ci.yml 更新**

`.github/workflows/ci.yml` 内の以下を一括置換:
- `actions/checkout@v4` → `actions/checkout@v6` （2箇所）
- `actions/setup-node@v4` → `actions/setup-node@v6` （2箇所）
- `pnpm/action-setup@v4` → `pnpm/action-setup@v6` （2箇所）

検索コマンド: `grep -n 'uses:' .github/workflows/ci.yml`

- [ ] **Step 2: lighthouse.yml 更新**

`.github/workflows/lighthouse.yml` 内の以下を置換:
- `actions/checkout@v4` → `actions/checkout@v6`
- `actions/setup-node@v4` → `actions/setup-node@v6`
- `pnpm/action-setup@v4` → `pnpm/action-setup@v6`
- `treosh/lighthouse-ci-action@v12` はそのまま（最新メジャー）

- [ ] **Step 3: YAML 構文チェック**

Run:
```bash
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/ci.yml')); yaml.safe_load(open('.github/workflows/lighthouse.yml'))" && echo OK
```

Expected: `OK`

- [ ] **Step 4: 古いバージョンが残っていないか確認**

Run: `grep -E 'actions/checkout@v[0-5]|actions/setup-node@v[0-5]|pnpm/action-setup@v[0-5]' .github/workflows/*.yml`

Expected: `(no output)` — 何も引っかからない

- [ ] **Step 5: コミット**

```bash
git add .github/workflows/ci.yml .github/workflows/lighthouse.yml
git commit -m "chore: GitHub Actions を v6 系に更新（Node.js 20 廃止対応）"
```

- [ ] **Step 6: push して CI が緑になることを確認**

Run: `git push origin main`

その後、CI 完了を待つ:
```bash
gh run list --branch main --limit 1
gh run watch
```

Expected: `ci` ジョブが緑。lighthouse.yml は cron なので即実行されないが、`gh workflow run lighthouse.yml` で手動 trigger して緑を確認:

```bash
gh workflow run lighthouse.yml
sleep 10
gh run list --workflow lighthouse.yml --limit 1
```

最新ランの conclusion が `success` であること。

---

## Task 4: CI 緑の Dependabot PR を順次マージ（9 件）

**Files:** PR をマージするだけ（コード変更なし。Task 3 の push で各 Dependabot PR が自動 rebase されるはず）

- [ ] **Step 1: 全 PR の最新 CI ステータス確認**

Run:
```bash
for pr in 21 22 23 24 25 26 28 29 30; do
  echo -n "PR #$pr: "
  gh pr view $pr --json statusCheckRollup --jq '[.statusCheckRollup[] | select(.name == "ci") | .conclusion] | first'
done
```

Expected: すべて `SUCCESS`。SUCCESS でないものはスキップして手動調査。

- [ ] **Step 2: パッチ系から順にマージ（小さい変更から）**

以下の順で実行（各 PR ごとに失敗したら止めて状況確認）:

```bash
gh pr merge 21 --squash --delete-branch  # @radix-ui/react-slot 1.2.3→1.2.4 (patch)
gh pr merge 24 --squash --delete-branch  # hono 4.12.8→4.12.10 (patch)
gh pr merge 25 --squash --delete-branch  # @cloudflare/workers-types (patch)
gh pr merge 30 --squash --delete-branch  # typescript-eslint 8.57.2→8.58.0 (patch)
gh pr merge 28 --squash --delete-branch  # eslint 10.1.0→10.2.0 (patch)
gh pr merge 29 --squash --delete-branch  # @tailwindcss/vite (patch)
```

Expected: 各コマンドが成功し PR が closed/merged になる。コンフリクトが出たら個別に Dependabot rebase を依頼:
```bash
gh pr comment <PR#> --body "@dependabot rebase"
```

- [ ] **Step 3: マイナーバージョン PR をマージ**

```bash
gh pr merge 26 --squash --delete-branch  # wouter 3.7.1→3.9.0 (minor)
gh pr merge 22 --squash --delete-branch  # @types/node 24.7.0→25.5.2 (devDep, major だが型のみ)
gh pr merge 23 --squash --delete-branch  # esbuild 0.25.10→0.28.0 (devDep)
```

Expected: 全部成功。`@types/node` は dev dependency で型しか参照しないので CI 緑なら安全。`esbuild` も dev のみ。

- [ ] **Step 4: 結果確認**

```bash
gh pr list --state open --label dependencies
```

Expected: PR #27 のみ（または空）。

- [ ] **Step 5: ローカル main を最新化**

```bash
git fetch origin
git checkout main
git pull --ff-only origin main
```

---

## Task 5: PR #27 (react+@types/react) を close → 次サイクルでまとめ直し

**Why:** `react` だけ 19.2.4 に上がるが `react-dom` が 19.2.1 のまま放置されてバージョン不整合。Task 1 のグループ設定で次サイクルから 4 パッケージ同時に上がるようになるので、現 PR は閉じる。

- [ ] **Step 1: PR #27 にコメントを残す**

Run:
```bash
gh pr comment 27 --body "react-dom が同じグループに入っておらずバージョン不整合で CI が落ちていたため close。dependabot.yml に group 設定を追加したので、次回サイクルで react / react-dom / @types/react / @types/react-dom が同一 PR にまとまって再発行されます。"
```

- [ ] **Step 2: PR #27 を close（マージしない）**

Run: `gh pr close 27 --delete-branch`

Expected: PR が closed になり Dependabot ブランチが削除される。

- [ ] **Step 3: open PR が空であることを確認**

Run: `gh pr list --state open`

Expected: 空（または直近で push した修正コミット由来のものだけ）。

- [ ] **Step 4: Dependabot に再生成を依頼（任意・即実行したい場合）**

待っていれば次の月曜に自動で出るが、すぐ確認したい場合は:

```bash
gh api -X POST repos/hayashiii-ghub/toban-app/dependabot/alerts -f state=open 2>/dev/null || true
# 上は alerts の確認用。Dependabot の手動 trigger は GitHub Web UI の "Insights → Dependency graph → Dependabot" からのみ
```

通常は次サイクルを待つだけで OK。

---

## Task 6: 全体検証

- [ ] **Step 1: main の最新 CI が緑か確認**

Run: `gh run list --branch main --limit 5`

Expected: 直近 5 件すべて `success`。warning でも Node.js 20 deprecation メッセージが消えていること。

- [ ] **Step 2: Lighthouse cron を手動 trigger**

Run:
```bash
gh workflow run lighthouse.yml
sleep 30
gh run list --workflow lighthouse.yml --limit 1
```

Expected: status が `in_progress` または `completed` で `success`。

- [ ] **Step 3: open PR の状況確認**

Run: `gh pr list --state open`

Expected: 空、または直近で意図的に残しているもののみ。

- [ ] **Step 4: ブランチ保護がまだ有効か確認（消えていないこと）**

Run: `gh api repos/hayashiii-ghub/toban-app/branches/main/protection --jq '{allow_force_pushes: .allow_force_pushes.enabled, allow_deletions: .allow_deletions.enabled}'`

Expected: `{"allow_force_pushes": false, "allow_deletions": false}`

---

## ロールバック手順

各タスクは独立しているので、問題が出たら該当コミットだけ revert:

```bash
git log --oneline -10                        # 該当コミットを特定
git revert <commit-sha>                       # 取り消しコミット作成
git push origin main
```

PR マージの取り消しは GitHub UI の「Revert」ボタン、または該当コミットを `git revert` して別 PR で戻す。

---

## Self-Review チェック

- ✅ Spec の3項目（Lighthouse / Node 廃止 / Dependabot）すべてカバー
- ✅ 各タスクが独立しており、途中で止まっても安全
- ✅ プレースホルダなし。すべてのコマンドが実行可能な形で書かれている
- ✅ 検証手順あり（Step 3 の curl / Step 4 の gh run list）
- ✅ ロールバック手順あり
