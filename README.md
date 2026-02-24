# Lab Checkpoint 🧬

バイオ系ラボの安全ルールを「検問ゲーム」形式で楽しく学べる Web アプリ。プレイヤーは安全監査官として、作業者の手順が正しいか（通過許可）違反しているか（違反指摘）を判定します。

---

## ゲームの仕組み

- **ランダム検問モード**: 全カテゴリからランダム 10 問を出題（デフォルト）
- **カテゴリ訓練モード**: 特定カテゴリに絞って練習
- **3 ミスでゲームオーバー**: 誤判定が 3 回に達すると QUARANTINE（隔離）
- **ランク制**: S(100%) / A(80%+) / B(60%+) / F で結果評価
- **S ランク演出**: 「細胞が見えてきましたね」

### カテゴリ

| カテゴリ | 内容 |
|----------|------|
| 細胞培養基本 | クリーンベンチ操作、継代培養、コンタミ防止 |
| ゾーニング | クリーンルーム入退室、エリア区分、物品管理 |
| 試薬安全管理 | 保管方法、保護具、廃液処理 |
| ラボルール | 実験記録、退室手順、飲食禁止 |
| 報告ルート | インシデント対応、報告手順 |

---

## アーキテクチャ

```
Google Apps Script (GAS) Web App
├── src/                    # GAS サーバーコード (TypeScript → esbuild → IIFE)
│   ├── index.ts            # doGet + apiCall エントリーポイント
│   ├── router.ts           # アクション振り分け
│   ├── auth.ts             # Google Workspace SSO (Session.getActiveUser)
│   ├── sheets.ts           # Spreadsheet CRUD ヘルパー
│   └── handlers/           # ビジネスロジック
│       ├── categories.ts
│       ├── scenarios.ts    # メインゲームロジック
│       └── quizzes.ts      # 旧クイズシステム（未使用）
│
├── frontend/               # React SPA (Vite + vite-plugin-singlefile)
│   └── src/
│       ├── App.tsx          # HashRouter (単一ルート)
│       ├── pages/
│       │   └── QuizPage.tsx # ゲーム画面（選択→検問→結果）
│       ├── components/
│       │   └── Layout.tsx   # ナビバー
│       └── lib/
│           ├── api.ts       # GAS/mock 自動切替 API クライアント
│           ├── mock.ts      # ローカル開発用モックデータ
│           └── sound.ts     # SE 管理
│
├── dist/                   # ビルド成果物 (clasp push 対象)
│   ├── bundle.js           # GAS サーバーバンドル
│   ├── index.html          # フロントエンド SPA (インライン)
│   └── appsscript.json     # GAS マニフェスト
│
└── backend/                # 旧 Hono/PostgreSQL バックエンド（参考用、未使用）
```

### データストア

Google Spreadsheet（6 シート）: `categories`, `scenarios`, `quizzes`, `users`, `quiz_answers`, `badges`

### 認証

Google Workspace SSO — `Session.getActiveUser()` による自動認証。ログイン画面なし。

---

## セットアップ

### 前提条件

- Node.js 20+
- Google アカウント（Workspace 推奨）
- clasp（`npm install -g @google/clasp`）

### 手順

```bash
# 1. 依存パッケージインストール
npm install
cd frontend && npm install && cd ..

# 2. GAS プロジェクトの設定
#    .env に SCRIPT_ID を設定
#    GAS Script Properties に SPREADSHEET_ID を設定

# 3. ビルド
npx esbuild src/index.ts --bundle --platform=neutral --outfile=dist/bundle.js --format=iife
cd frontend && npx vite build && cd ..

# 4. デプロイ
npx clasp push
```

### ローカル開発

```bash
cd frontend && npx vite dev
```

GAS 環境外ではモックデータで動作します（`api.ts` が自動切替）。

---

## 技術スタック

| レイヤー | 技術 |
|----------|------|
| サーバー | Google Apps Script (TypeScript) |
| フロントエンド | React + TypeScript + Tailwind CSS v4 |
| ビルド (サーバー) | esbuild (IIFE) |
| ビルド (フロント) | Vite + vite-plugin-singlefile |
| データ | Google Spreadsheet |
| 認証 | Google Workspace SSO |
| デプロイ | clasp |
