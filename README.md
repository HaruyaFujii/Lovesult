# Lovesult - マッチングSNSアプリケーション

恋愛ステータスと性格診断を基にしたマッチングSNSアプリケーション

## 📁 プロジェクト構成

```
Lovesult/
├── backend/                  # FastAPI バックエンドAPI
│   ├── api/                 # APIレイヤー
│   │   ├── main.py          # エントリーポイント
│   │   ├── config/          # 設定管理
│   │   ├── core/            # 共通機能（認証、依存関係）
│   │   └── features/        # 機能別API実装
│   │       ├── account/     # アカウント管理
│   │       ├── dm/          # ダイレクトメッセージ
│   │       ├── follows/     # フォロー機能
│   │       ├── likes/       # いいね機能
│   │       ├── notifications/ # 通知機能
│   │       ├── personality/ # 性格診断
│   │       ├── posts/       # 投稿（リプライ統合）
│   │       ├── reports/     # 通報機能
│   │       ├── search/      # 検索機能
│   │       └── users/       # ユーザー管理
│   ├── packages/            # ドメイン・インフラ層
│   │   ├── models/          # SQLModelテーブル定義
│   │   ├── repositories/    # データアクセス層
│   │   ├── services/        # ビジネスロジック層
│   │   └── db/              # DB接続・マイグレーション
│   └── tests/               # テストコード
└── frontend/                # Next.js フロントエンド
    └── app/                 # App Router構成
        ├── (auth)/          # 認証ページ群
        ├── (main)/          # メインアプリ
        │   ├── messages/    # DM機能
        │   ├── notifications/ # 通知
        │   ├── personality/ # 性格診断
        │   ├── post/        # 投稿詳細
        │   ├── profile/     # プロフィール
        │   ├── search/      # 検索
        │   ├── settings/    # 設定
        │   └── timeline/    # タイムライン
        ├── components/      # UIコンポーネント
        ├── lib/             # ライブラリ設定
        ├── hooks/           # カスタムフック
        └── providers/       # Context Providers
```

## 🏗 アーキテクチャ

### 技術スタック
- **Frontend**: Next.js 16 (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: FastAPI + SQLModel + Alembic
- **Database**: PostgreSQL (Supabase)
- **Authentication**: Supabase Auth (JWT)
- **Package Manager**: Backend - uv / Frontend - Yarn 4
- **API Client Generation**: Orval (OpenAPI → TypeScript)

### アーキテクチャパターン

#### Backend - クリーンアーキテクチャ
```
API Layer (Router → UseCase → Schema)
    ↓
Service Layer (Business Logic)
    ↓
Repository Layer (Data Access)
    ↓
Model Layer (Data Structure)
```

#### Frontend - Component-Based Architecture
- **App Router**: ファイルベースルーティング
- **Server/Client Components**: 適切な分離
- **API通信**: 自動生成されたTypeScriptクライアント使用

## 🚀 セットアップ手順

### 1. Supabaseプロジェクトの作成

1. [Supabase](https://supabase.com)にアクセスしてプロジェクトを作成
2. プロジェクトダッシュボードから以下の情報を取得：
   - Project URL
   - Anon Key
   - Service Role Key
   - JWT Secret（Settings > API > JWT Settings）
   - Database URL（Settings > Database）

### 2. Supabase設定

#### 認証設定
1. Authentication > Providers でEmail/Password認証を有効化
2. Authentication > URL Configuration で以下を設定：
   - Site URL: `http://localhost:3000`
   - Redirect URLs: `http://localhost:3000/**`

### 3. 環境変数の設定

#### Backend (.env)
```bash
cd backend
cp .env.example .env  # .env.exampleがない場合は新規作成
```

`.env`を編集：
```env
# Supabase（ダッシュボードから取得）
SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
SUPABASE_JWT_SECRET=your-jwt-secret

# Database
DATABASE_URL=postgresql+asyncpg://postgres.YOUR_PROJECT_ID:YOUR_PASSWORD@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres

# App設定
ENV=development
DEBUG=true
CORS_ORIGINS=http://localhost:3000
```

#### Frontend (.env.local)
```bash
cd frontend
cp .env.example .env.local  # .env.exampleがない場合は新規作成
```

`.env.local`を編集：
```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 4. Backendセットアップ

```bash
cd backend

# uvのインストール（未インストールの場合）
curl -LsSf https://astral.sh/uv/install.sh | sh

# 依存関係インストール
uv sync --dev

# データベースマイグレーション実行
uv run alembic upgrade head

# 開発サーバー起動
make dev
# または
uv run uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
```

Backend APIドキュメント: http://localhost:8000/docs

### 5. Frontendセットアップ

```bash
cd frontend

# 依存関係インストール（Yarn 4使用）
yarn install

# API クライアント生成
yarn gen

# 開発サーバー起動
yarn dev
```

Frontend: http://localhost:3000

## 🔧 開発コマンド

### Backend
```bash
make dev          # 開発サーバー起動
make lint         # Lintチェック (ruff + mypy)
make fmt          # コードフォーマット
make fix          # 自動修正
make test         # テスト実行
make migrate      # マイグレーション適用
make gen          # OpenAPIスキーマ生成
```

### Frontend
```bash
yarn dev          # 開発サーバー起動
yarn build        # ビルド
yarn lint         # Lintチェック
yarn fmt          # コードフォーマット
yarn gen          # APIクライアント生成
```

## ⚠️ 重要なお知らせ

### DM機能について
DM（ダイレクトメッセージ）機能は、日本の電気通信事業法に基づく届出が必要なため、現在一時的に利用を停止しています。
- 届出手続き完了後、機能を再開する予定です
- バックエンドのロジックは実装済みですが、フロントエンドでは利用不可の表示となります
- ご不便をおかけして申し訳ございません

## 🌟 機能一覧

### 実装済み機能 ✅

#### 基本機能
- ✅ **認証システム**: Supabase Authによるメール/パスワード認証
- ✅ **ユーザープロフィール**: ニックネーム、ステータス、性別、年代、自己紹介、アバター
- ✅ **恋愛ステータス**: 恋愛中(IN_LOVE) / 失恋中(HEARTBROKEN) / 探し中(SEEKING)

#### 投稿機能
- ✅ **投稿管理**: 作成・編集・削除（リプライを統合した階層構造）
- ✅ **リプライ機能**: ネストされた返信（無限階層対応）
- ✅ **いいね機能**: 投稿・リプライへのいいね
- ✅ **タイムライン**: ステータス優先表示、無限スクロール、フォロー中タイムライン

#### ソーシャル機能
- ✅ **フォロー機能**: フォロー/アンフォロー、フォロワー・フォロー中一覧
- ✅ **検索機能**: ユーザー検索、投稿検索（フィルタリング対応）
- ✅ **通知システム**: フォロー、いいね、リプライの通知

#### 性格診断・マッチング
- ✅ **性格診断テスト**: 20問の質問による性格タイプ判定
- ✅ **16タイプ性格分類**: MBTI風の性格タイプ分類
- ✅ **レコメンデーション**: 相性の良いユーザーの提案

#### DM機能
- ⚠️ **ダイレクトメッセージ**: **※現在利用不可（電気通信事業届出申請中）**
  - 電気通信事業法に基づく届出が必要なため、現在機能を一時停止中
  - 届出完了後にサービスを再開予定
  - 実装済み機能: 1対1のメッセージング、会話管理、既読管理、未読数表示、ポーリングによる新着メッセージ取得

#### モデレーション
- ✅ **通報機能**: 不適切な投稿・ユーザーの通報
- ✅ **暴言フィルター**: 禁止ワードによるコンテンツフィルタリング

#### UI/UX機能
- ✅ **レスポンシブデザイン**: モバイル最適化
- ✅ **プルトゥリフレッシュ**: モバイルでの更新
- ✅ **スワイプバック**: iOSライクなナビゲーション
- ✅ **ボトムナビゲーション**: モバイル向けナビゲーション
- ✅ **FAB (Floating Action Button)**: 投稿作成ボタン

### データベース構成

#### 主要テーブル
- **users**: ユーザー情報、プロフィール
- **posts**: 投稿とリプライ（統合管理）
- **likes**: いいね情報
- **reply_likes**: リプライへのいいね
- **follows**: フォロー関係
- **conversations**: DM会話
- **direct_messages**: DMメッセージ
- **conversation_participants**: 会話参加者
- **notifications**: 通知
- **personality_results**: 性格診断結果
- **reports**: 通報情報
- **banned_words**: 禁止ワード

## 📝 API仕様（主要エンドポイント）

### 認証・アカウント
```
POST   /api/v1/account/signup         # サインアップ
POST   /api/v1/account/login          # ログイン
PUT    /api/v1/account/update         # アカウント更新
```

### ユーザー
```
GET    /api/v1/users/me               # 現在のユーザー情報
GET    /api/v1/users/{user_id}        # ユーザー詳細
PUT    /api/v1/users/me               # プロフィール更新
GET    /api/v1/users                  # ユーザー一覧
```

### 投稿
```
GET    /api/v1/posts                  # タイムライン取得
POST   /api/v1/posts                  # 投稿作成
GET    /api/v1/posts/{post_id}        # 投稿詳細
PUT    /api/v1/posts/{post_id}        # 投稿更新
DELETE /api/v1/posts/{post_id}        # 投稿削除
GET    /api/v1/posts/{post_id}/replies # リプライ取得
POST   /api/v1/posts/{post_id}/replies # リプライ作成
```

### いいね
```
POST   /api/v1/posts/{post_id}/like   # いいねする
DELETE /api/v1/posts/{post_id}/unlike # いいね解除
POST   /api/v1/posts/{post_id}/replies/{reply_id}/like   # リプライにいいね
DELETE /api/v1/posts/{post_id}/replies/{reply_id}/unlike # リプライのいいね解除
```

### フォロー
```
POST   /api/v1/users/{user_id}/follow         # フォロー
DELETE /api/v1/users/{user_id}/follow         # フォロー解除
GET    /api/v1/users/{user_id}/follow-status  # フォロー状態
GET    /api/v1/users/{user_id}/followers      # フォロワー一覧
GET    /api/v1/users/{user_id}/following      # フォロー中一覧
```

### DM ※現在利用不可（電気通信事業届出申請中）
```
GET    /api/v1/conversations          # 会話一覧
POST   /api/v1/conversations          # 会話作成
GET    /api/v1/conversations/{conversation_id}/messages # メッセージ取得
POST   /api/v1/conversations/{conversation_id}/messages # メッセージ送信
POST   /api/v1/conversations/{conversation_id}/read     # 既読にする
```

### 性格診断
```
GET    /api/v1/personality/questions  # 診断質問取得
POST   /api/v1/personality/submit     # 診断結果送信
GET    /api/v1/personality/me         # 自分の診断結果
GET    /api/v1/personality/recommendations # おすすめユーザー
```

### 検索
```
GET    /api/v1/search/posts           # 投稿検索
GET    /api/v1/search/users           # ユーザー検索
```

### 通知
```
GET    /api/v1/notifications          # 通知一覧
POST   /api/v1/notifications/{id}/read # 既読にする
```

### 通報
```
POST   /api/v1/reports                # 通報送信
```

## 🐛 トラブルシューティング

### よくある問題

1. **認証エラー**
   - JWT Secretが正しく設定されているか確認
   - Supabase Anon Keyが正しいか確認

2. **CORS エラー**
   - Backend の `CORS_ORIGINS` に `http://localhost:3000` が含まれているか確認

3. **データベース接続エラー**
   - DATABASE_URLが正しいか確認
   - Supabaseダッシュボードでデータベースが起動しているか確認

4. **マイグレーションエラー**
   - DATABASE_URLの末尾に `?sslmode=require` を追加してみる

5. **APIクライアント生成エラー**
   - バックエンドが起動していることを確認
   - `make gen` (backend) → `yarn gen` (frontend) の順で実行

## 🔒 セキュリティ

- JWT認証によるAPIアクセス制御
- Supabase Row Level Security (RLS) は現在無効（本番では有効化推奨）
- 暴言フィルターによるコンテンツ制御
- 通報機能による不適切コンテンツ管理
- Service Role Keyはバックエンドのみで使用
- 本番環境では必ずHTTPS化すること

## 📋 今後の開発予定

### 優先度高
- [ ] リアルタイムメッセージング（WebSocket）
- [ ] プッシュ通知
- [ ] 画像アップロード最適化
- [ ] ブロック機能
- [ ] メッセージの削除機能
- [ ] 検索画面のUIがスマホだとはみ出たり、上へスワイプする時に反応がとても悪いので修正
- [ ] ボトムナビゲーションがUIを侵食しているのが多い問題を修正

### 優先度中
- [ ] グループメッセージング
- [ ] 投稿の下書き機能
- [ ] ハッシュタグ機能
- [ ] メンション機能
- [ ] 投稿のブックマーク

### 優先度低
- [ ] ダークモード
- [ ] 多言語対応
- [ ] PWA対応
- [ ] アナリティクス機能

## 📄 ライセンス

プロプライエタリ - 無断での使用・複製・配布を禁止します