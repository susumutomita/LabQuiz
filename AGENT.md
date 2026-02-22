# AGENT.md — https://github.com/o-shina/scrum-guardこれと同じ仕組みで細胞培養の基本やラボルール会社の仕組みを楽しく覚えてテストできる仕組みを作りたい

> This file configures AI coding agents (Claude Code, Cursor, Copilot, etc.) for this project.
> Read this file first before making any changes.

## Project Overview

バイオ系ラボにおいて、新人スタッフ（月1人以上入社）への教育がOJT中心で1人あたり1ヶ月以上かかり、口頭伝達による抜け漏れ・属人化が常態化している。特にゾーニング（汚染エリア区分）は暗黙知化しており体系的に教えられない。結果としてコンタミが数ヶ月に1回発生し、先輩社員の教育工数が継続的に浪費されている。scrum-guard のようなクイズ形式の反復学習システムで、細胞培養手順・ラボルール・安全管理を構造化し、新人が自律的に学習・テストできる仕組みを構築する。

**Target User**: バイオ系中規模ラボ（10〜30人）の新人スタッフ（入社直後〜3ヶ月目）、教育担当の先輩研究員、クイズ内容をレビューする専門家（研究責任者等）、学習進捗を把握するラボマネージャー

## Core Features

- **カテゴリ別クイズ出題・回答エンジン**: 「細胞培養基本」「ゾーニング」「試薬安全管理」「ラボルール」「報告ルート」等のカテゴリから4択クイズを出題。正誤判定・解説表示・スコア計算をリアルタイムで実施。満点を目指す反復動機づけとしてスコアとバッジを付与する。
- **クイズ問題管理・AI生成＋専門家レビュー**: 既存マニュアル（PDF/テキスト）をアップロードすると、AIが4択クイズ候補を生成。専門家が差分レビュー画面で承認/修正/却下を行う。承認済み問題のみが出題対象になる。
- **ゾーニング視覚化クイズ**: ラボの平面図画像上にエリアをマッピングし、「このエリアで安全キャビネットは必要か？」等のゾーニング判断をクイズ化。暗黙知を視覚的に構造化して出題する。
- **学習進捗ダッシュボード**: 新人ごとのカテゴリ別正答率・受験回数・満点達成状況・弱点カテゴリを一覧表示。ラボマネージャーがOJT補足箇所を特定できる。
- **ユーザー・ロール管理**: 新人（学習者）、先輩研究員（問題作成者）、専門家（レビュアー）、ラボマネージャー（管理者）のロールを管理。ロールに応じた画面・機能アクセス制御。

## Non-Goals

- 複数ラボ間の統合管理・マルチテナント対応（現時点では単一ラボ対象）
- OJT自体の廃止（対面教育の補完であり代替ではない）
- 動画教材の作成・配信機能
- スマートフォンネイティブアプリの開発（Webブラウザ対応のみ）
- 教育コストの自動金額換算・ROI算出ダッシュボード

## Implementation Spec

# LabQuiz — Implementation Spec

## Tech Stack
- Frontend: React + TypeScript + Vite + TailwindCSS
- Backend: Node.js + Hono + TypeScript
- Database: PostgreSQL
- Storage: S3互換ストレージ（MinIO or AWS S3）
- Auth: JWT（サーバーサイドセッション管理）
- AI: OpenAI API（GPT-4）
- Infra: Docker Compose

## API Endpoints (top 5 only)
| Method | Path | Description |
|--------|------|-------------|
| POST | /api/auth/login | メール+パスワードで認証しJWTを返す |
| GET | /api/quizzes | カテゴリ・件数指定で承認済みクイズをランダム取得 |
| POST | /api/quizzes/:quizId/answer | 回答を送信し正誤・解説・スコアを返す |
| POST | /api/quizzes/generate | マニュアルPDFをアップロードしAIでクイズ候補生成 |
| PUT | /api/quizzes/:quizId/review | 専門家がクイズを承認/修正/却下 |

## Database Schema
sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL, -- learner/creator/reviewer/admin
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE quizzes (
  id UUID PRIMARY KEY,
  category_id UUID NOT NULL,
  question TEXT NOT NULL,
  choices JSONB NOT NULL, -- [{id, text}]
  correct_choice_id TEXT NOT NULL,
  explanation TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending/approved/rejected
  created_by UUID NOT NULL,
  reviewed_by UUID,
  floor_plan_zone_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE quiz_answers (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  quiz_id UUID NOT NULL,
  session_id UUID NOT NULL,
  choice_id TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  answered_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE floor_plans (
  id UUID PRIMARY KEY,
  image_url TEXT NOT NULL,
  zones JSONB NOT NULL, -- [{zoneId, label, rect:{x,y,w,h}, type}]
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE categories (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT
);

CREATE TABLE badges (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  category_id UUID NOT NULL,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


## Screens (max 4)
| Screen | Path | Description |
|--------|------|-------------|
| ログイン | /login | メール+パスワード認証、ロール別リダイレクト |
| クイズ画面 | /quiz | カテゴリ選択→4択出題→即時正誤・解説表示→スコア確認 |
| レビュー画面 | /review | AI生成クイズ一覧の承認/修正/却下操作（reviewer/admin） |
| ダッシュボード | /dashboard | 全ユーザーのカテゴリ別正答率・弱点・受験回数一覧（admin） |

## Key Test Cases (max 5)
| Test | Given | When | Then |
|------|-------|------|------|
| 承認済みのみ出題 | 承認済み3件・未承認2件がDBにある | GET /api/quizzes?category=X | 承認済み3件のみ返却される |
| 正答でスコア保存 | 認証済みユーザー、正しいchoiceIdを送信 | POST /api/quizzes/:id/answer | is_correct=true、quiz_answersにレコード挿入される |
| 満点時バッジ付与 | 10問セッションで全問正解 | セッション終了API呼び出し | badgesテーブルに該当カテゴリのバッジが挿入される |
| 権限外アクセス拒否 | learnerロールのJWT | PUT /api/quizzes/:id/review | 403レスポンスが返る |
| カテゴリ0件エラー | 指定カテゴリに承認済み問題が0件 | GET /api/quizzes?category=empty | 空配列+メッセージを返す（200） |

## Implementation Constraints
- Real DB/API connections only. No mock data, no hardcoded arrays.
- Backend-first: implement API before UI.
- Show "Not implemented" for unfinished features.
- All API endpoints must be callable by external services (API-first design).
- パスワードはbcryptでハッシュ化必須。
- ファイルアップロードはS3互換ストレージに保存し、DBにはURLのみ保存。
- AI生成はOpenAI APIへの実接続のみ（モック不可）；障害時は既存クイズ出題は継続。
- DBスキーマ変更はマイグレーションファイル（db/migrations/）で管理。
- Docker Composeでapp・db・storageの3サービスを起動可能にする。
- 楽観的ロック：quizzesテーブルにupdated_atを用いて同時レビュー競合を検出し409を返す。


## Rules

### MUST (Required)

- **Backend-first**: Implement API endpoints before building UI
- **Real data only**: All data must come from real DB/API connections
- **API-first**: All endpoints must be callable by external services
- **Test coverage**: Write tests for all new code paths
- **Show "Not implemented"**: Display clearly for unfinished features

### NEVER (Prohibited)

- **NEVER use hardcoded/mock data** as a substitute for real DB or API calls
- **NEVER fabricate** sample data, metrics, or statistics — use only real values
- **NEVER silently skip errors** — always handle and surface them to the user
- **NEVER change the meaning** of domain-specific terms by paraphrasing them
- **NEVER commit secrets** (API keys, tokens, passwords) to the repository
- **NEVER implement UI before the backend** that supports it
- **NEVER mark a task as complete** if tests are failing or features are partial

## Workflow

1. Read `Plan.md` to understand current progress and next steps
2. Pick the next unchecked task from Plan.md
3. Implement with real data connections (no mocks)
4. Run tests and verify
5. Update Plan.md with progress

## File Structure

| File | Purpose |
|------|---------|
| `PRD.md` | Product requirements and acceptance criteria |
| `spec.json` | Structured implementation specification |
| `Plan.md` | Step-by-step execution plan with progress tracking |
| `AGENT.md` | This file — agent configuration and rules |
