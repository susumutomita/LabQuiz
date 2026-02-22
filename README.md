# LabQuiz 🧬

バイオ系ラボの新人教育をクイズ形式の反復学習で効率化するWebアプリケーションです。OJT中心の属人的な教育体制によるコンタミ発生・先輩社員の工数浪費という課題に対し、細胞培養手順・ゾーニング・試薬安全管理・ラボルールを構造化されたクイズとして提供し、新人が自律的に学習・テストできる仕組みを構築します。

---

## 主要機能

- **カテゴリ別クイズ出題エンジン**：「細胞培養基本」「ゾーニング」「試薬安全管理」「ラボルール」「報告ルート」等から4択クイズをランダム出題。即時正誤判定・解説表示・スコア計算・満点バッジ付与
- **AI問題生成 ＋ 専門家レビューワークフロー**：マニュアルPDF/TXTをアップロードするとOpenAI APIがクイズ候補を自動生成。専門家が承認/修正/却下を行い、承認済み問題のみが出題対象になる
- **ゾーニング視覚化クイズ**：ラボ平面図上にエリアを矩形マッピングし、ゾーン属性（清潔/準清潔/一般）に基づいたゾーニング判断クイズを出題。暗黙知を視覚的に構造化
- **学習進捗ダッシュボード**：ユーザーごとのカテゴリ別正答率・受験回数・弱点カテゴリを一覧表示。正答率70%未満を「要注意」でハイライト。CSVエクスポート対応
- **ロールベースアクセス制御**：learner / creator / reviewer / admin の4ロールを管理し、画面・API両方でアクセスを制御

---

## リポジトリ構成

```
labquiz/
├── AGENT.md                  # AIコーディングエージェント向け実装ルール・制約
├── Plan.md                   # 機能ごとの実装計画・タスク分解・進捗管理
├── docker-compose.yml        # app / db / storage の3サービス定義
├── .env.example              # 環境変数テンプレート（APIキー・DB接続先等）
│
├── backend/                  # Node.js + Hono + TypeScript
│   ├── src/
│   │   ├── routes/           # APIルート（auth / quizzes / review / dashboard）
│   │   ├── services/         # ビジネスロジック（quiz engine / AI生成 / スコア集計）
│   │   ├── middleware/       # JWT認証・ロール検証・バリデーション
│   │   └── index.ts          # エントリーポイント
│   └── db/
│       └── migrations/       # DBスキーママイグレーションファイル
│
└── frontend/                 # React + TypeScript + Vite + TailwindCSS
    └── src/
        ├── pages/            # /login / /quiz / /review / /dashboard
        ├── components/       # 共通UIコンポーネント
        └── api/              # バックエンドAPIクライアント
```

### 主要ファイル説明

| ファイル | 説明 |
|---|---|
| `AGENT.md` | 実装ルール・制約・禁止事項（モック不可・バックエンド優先等）をAIエージェントに伝えるための指示書 |
| `Plan.md` | MVP機能の実装順序・タスク一覧・受け入れ基準・進捗チェックリスト |
| `docker-compose.yml` | PostgreSQL・MinIO（S3互換ストレージ）・アプリサーバーをワンコマンドで起動 |
| `db/migrations/` | `users` / `quizzes` / `quiz_answers` / `floor_plans` / `categories` / `badges` テーブルのマイグレーション管理 |
| `.env.example` | `DATABASE_URL` / `OPENAI_API_KEY` / `S3_ENDPOINT` 等の環境変数テンプレート |

---

## セットアップ

### 前提条件

- Docker / Docker Compose
- Node.js 20+
- OpenAI APIキー

### 起動手順（30分以内で完了）

```bash
# 1. リポジトリをクローン
git clone https://github.com/your-org/labquiz.git
cd labquiz

# 2. 環境変数を設定
cp .env.example .env
# .env を編集し OPENAI_API_KEY 等を設定

# 3. 全サービスを起動（app / db / storage）
docker compose up -d

# 4. DBマイグレーションを実行
docker compose exec app npm run migrate

# 5. 管理者ユーザーを作成
docker compose exec app npm run seed:admin

# 6. ブラウザでアクセス
open http://localhost:5173
```

---

## AIコーディングエージェントでの使い方

本リポジトリは `AGENT.md` と `Plan.md` を活用してAIコーディングエージェント（GitHub Copilot / Cursor / Claude等）と協調開発することを前提としています。

### 手順

1. **`AGENT.md` を最初に読み込ませる**
   エージェントのコンテキストに `AGENT.md` を追加し、実装ルール（モックデータ禁止・バックエンド優先・マイグレーション管理等）を認識させてください。

   ```
   # エージェントへの指示例
   「AGENT.md のルールに従って実装してください。モックデータは使用しないでください。」
   ```

2. **`Plan.md` でタスクを指定する**
   `Plan.md` に記載された機能タスクを1つ選び、エージェントに渡します。

   ```
   「Plan.md の『カテゴリ別クイズ出題エンジン』タスクを実装してください。
   受け入れ基準をすべて満たすまで実装を続けてください。」
   ```

3. **バックエンドから実装する**
   `AGENT.md` の制約に従い、UIより先にAPIエンドポイントを実装させてください。フロントエンド実装は対応するAPIが完成してから開始します。

4. **受け入れ基準をテストとして渡す**
   `Plan.md` の各タスクには受け入れ基準が記載されています。これをそのままテストケースとしてエージェントに渡すことで、実装精度が向上します。

5. **未実装機能は明示させる**
   エージェントに「未実装の機能はUIに『未実装』と表示し、モックで補完しないこと」を必ず指示してください。

---

## 主要APIエンドポイント

| Method | Path | 説明 |