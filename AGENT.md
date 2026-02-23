# AGENT.md — Lab Checkpoint

> AI コーディングエージェント向け設定ファイル。変更を加える前にこのファイルを読むこと。

## Project Overview

バイオ系ラボの安全ルールを「検問ゲーム」形式で学べる GAS Web App。プレイヤーは安全監査官として作業者の手順を判定する。

## Tech Stack

| レイヤー | 技術 |
|----------|------|
| サーバー | Google Apps Script (TypeScript → esbuild → IIFE) |
| フロントエンド | React + TypeScript + Tailwind CSS v4 + Vite |
| データ | Google Spreadsheet (6 シート) |
| 認証 | Google Workspace SSO (`Session.getActiveUser()`) |
| ビルド | esbuild (サーバー), Vite + vite-plugin-singlefile (フロント) |
| デプロイ | clasp push (`dist/` ディレクトリ) |

## File Structure

```
src/                        # GAS サーバーコード
├── index.ts                # doGet + apiCall (globalThis にエクスポート)
├── router.ts               # switch(action) で各ハンドラーに振り分け
├── auth.ts                 # getCurrentUser (Session.getActiveUser)
├── sheets.ts               # getSheetData, appendRow, generateId, shuffleArray
├── types.ts                # 型定義
└── handlers/
    ├── categories.ts       # カテゴリ取得
    ├── scenarios.ts        # シナリオ取得・判定・セッション完了
    └── quizzes.ts          # 旧クイズシステム（未使用）

frontend/src/               # React SPA
├── App.tsx                 # HashRouter (単一ルート /quiz)
├── components/Layout.tsx   # ナビバー (LAB CHECKPOINT)
├── pages/QuizPage.tsx      # メインゲーム画面
└── lib/
    ├── api.ts              # GAS/mock 自動切替 API クライアント
    ├── mock.ts             # ローカル開発用モックデータ
    └── sound.ts            # SE 管理

dist/                       # ビルド成果物 (clasp push 対象)
├── bundle.js               # GAS サーバーバンドル
├── index.html              # フロントエンド (インライン SPA)
└── appsscript.json         # GAS マニフェスト
```

## Key Patterns

- `google.script.run` を Promise でラップ (`api.ts` の `callGas`)
- すべてのサーバー関数は `apiCall(action, params)` 経由で呼び出し
- `globalThis.doGet` と `globalThis.apiCall` を `src/index.ts` 末尾でエクスポート
- GAS 環境外ではモックデータに自動フォールバック (`isGas` フラグ)
- フロントは HashRouter（GAS Web Apps はパスベースルーティング非対応）

## Data Schema (Spreadsheet)

| シート | 主要カラム |
|--------|-----------|
| categories | id, name, description |
| scenarios | id, category_id, char_name, char_role, char_avatar, situation, dialogue, reference, is_violation, explanation, status |
| quizzes | id, category_id, question, choice_a〜d, correct, explanation, status |
| users | email, name, role, created_at |
| quiz_answers | user_email, quiz_id, session_id, choice, is_correct, answered_at |
| badges | user_email, category_id, earned_at |

## Build Commands

```bash
# GAS サーバービルド
npx esbuild src/index.ts --bundle --platform=neutral --outfile=dist/bundle.js --format=iife

# フロントエンドビルド
cd frontend && npx vite build

# デプロイ
npx clasp push
```

**注意**: このマシンでは `make` は zsh 関数のため `/usr/bin/make` を使うか、コマンドを直接実行すること。

## Game Design

- **デフォルト**: 全カテゴリからランダム 10 問
- **カテゴリ訓練**: 個別カテゴリで練習
- **3 ミスでゲームオーバー** (QUARANTINE)
- **ランク制**: S(100%) / A(80%+) / B(60%+) / F
- **判定**: `playerChoseViolate === scenario.isViolation` → 正解
- **UI フェーズ**: select → inspect → feedback(モーダル) → arrest → result

## Rules

### MUST

- シナリオデータは Spreadsheet の `scenarios` シートから取得
- `status === 'approved'` のシナリオのみ出題
- フロントとバックエンドの両方をビルドして動作確認
- `categoryId` 省略時は全カテゴリから出題

### NEVER

- `dist/` 内のファイルを直接編集しない（ビルドで上書きされる）
- `rm` コマンドを使わない
- シークレット (.env, credentials) をコミットしない
