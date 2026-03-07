# LoveTalk - 恋愛相談SNS

恋愛相談を聞きたい人と聞いてほしい人をつなげるSNSアプリケーション

## 📁 プロジェクト構成

```
Lovesult/
├── backend/                  # FastAPI バックエンドAPI
│   ├── api/                 # APIレイヤー
│   │   ├── main.py          # エントリーポイント
│   │   ├── config/          # 設定管理
│   │   ├── core/            # 共通機能（認証、依存関係）
│   │   └── features/        # 機能別API実装
│   │       ├── health/      # ├─ router.py
│   │       ├── users/       # ├─ usecase.py
│   │       ├── posts/       # └─ schemas.py
│   │       └── replies/     # (各feature共通構成)
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
        ├── components/      # UIコンポーネント
        ├── lib/             # ライブラリ設定
        ├── hooks/           # カスタムフック
        └── providers/       # Context Providers
```

## 🏗 アーキテクチャ

### 技術スタック
- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend**: FastAPI + SQLModel + Alembic
- **Database**: PostgreSQL (Supabase)
- **Authentication**: Supabase Auth (JWT)

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

各featureは3ファイル構成：
- **router.py**: エンドポイント定義とHTTPハンドリング
- **usecase.py**: ビジネスロジックとサービス層の呼び出し
- **schemas.py**: リクエスト/レスポンスのスキーマ定義

#### Frontend - Component-Based Architecture
- **App Router**: ファイルベースルーティング
- **Server/Client Components**: 適切な分離
- **API通信**: Supabase Auth + Backend API

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

#### データベース設定
SupabaseのSQL Editorで以下を実行（Alembicマイグレーションを使う場合は不要）：

```sql
-- UUIDの拡張を有効化
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 注意: Alembicでマイグレーションを実行する場合、このSQLは不要です
```

### 3. 環境変数の設定

#### Backend (.env)
```bash
cd backend
cp .env.example .env
```

`.env`を編集：
```env
# Supabase（ダッシュボードから取得）
SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...  # Project API keys > anon
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...  # Project API keys > service_role
SUPABASE_JWT_SECRET=your-jwt-secret  # Settings > API > JWT Settings > JWT Secret

# Database（Settings > Database > Connection string）
DATABASE_URL=postgresql+asyncpg://postgres.YOUR_PROJECT_ID:YOUR_PASSWORD@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres

# App設定
ENV=development
DEBUG=true
CORS_ORIGINS=http://localhost:3000
```

#### Frontend (.env.local)
```bash
cd frontend
cp .env.example .env.local
```

`.env.local`を編集：
```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...  # anon keyと同じ
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 4. Backendセットアップ

```bash
cd backend

# Python 3.11が必要
python -m venv venv
source venv/bin/activate  # Windowsの場合: venv\Scripts\activate

# 依存関係インストール
pip install -e ".[dev]"

# データベースマイグレーション実行
alembic upgrade head

# 開発サーバー起動
make dev
# または
uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
```

Backend APIドキュメント: http://localhost:8000/docs

### 5. Frontendセットアップ

```bash
cd frontend

# 依存関係インストール（Yarn 4使用）
yarn install

# 開発サーバー起動
yarn dev
```

Frontend: http://localhost:3000

## 📝 重要な注意事項

### してはいけないこと ❌

1. **環境変数をGitにコミットしない**
   - `.env`、`.env.local`は絶対にコミットしない
   - 既に`.gitignore`に含まれているが確認すること

2. **Service Role Keyをフロントエンドで使わない**
   - フロントエンドでは必ずAnon Keyを使用
   - Service Role Keyはバックエンドのみ

3. **直接データベースに接続しない**
   - フロントエンドから直接Supabaseのデータベースを操作しない
   - 必ずバックエンドAPI経由でデータ操作を行う

4. **JWTシークレットを公開しない**
   - JWT検証はバックエンドでのみ行う
   - フロントエンドに露出させない

### 必須の作業 ✅

1. **Supabaseプロジェクトの作成と設定**
2. **環境変数の設定（Backend/Frontend両方）**
3. **データベースマイグレーションの実行**
4. **初回ユーザー登録時のフロー確認**

## 🔧 開発コマンド

### Backend
```bash
make dev          # 開発サーバー起動
make lint         # Lintチェック
make fmt          # コードフォーマット
make test         # テスト実行
make migrate      # マイグレーション適用
make gen-openapi  # OpenAPIスキーマ生成
```

### Frontend
```bash
yarn dev          # 開発サーバー起動
yarn build        # ビルド
yarn lint         # Lintチェック
yarn fmt          # コードフォーマット
yarn type-check   # 型チェック
```

## 🌟 機能一覧

### Phase 1 - MVP機能（実装済み） ✅
- ✅ メールアドレス/パスワード認証（Supabase Auth）
- ✅ ユーザープロフィール（ニックネーム、ステータス、性別、年代、自己紹介）
- ✅ 恋愛ステータス（恋愛中/失恋中/探し中）
- ✅ タイムライン（同じステータス優先表示：80%、他ステータス：20%）
- ✅ 投稿機能（作成・編集・削除）
- ✅ リプライ機能（作成・削除）
- ✅ 無限スクロール
- ✅ ステータスフィルター
- ✅ 投稿時ユーザー情報スナップショット機能

### Phase 2 - 拡張機能（部分実装）

#### 実装済み
- ✅ **データベース設計**: follows, likes, notifications, banned_words, reports テーブル
- ✅ **フォロー機能（Backend）**:
  - フォロー/アンフォロー API
  - フォロワー/フォロー中一覧 API
  - フォロー状態確認 API
  - フォロワー・フォロー数管理

#### 実装中/未実装
- ⏳ **いいね機能**: データベース設計済み、API未実装
- ⏳ **プロフィールアイコン**: データベース設計済み、Supabase Storage設定・API未実装
- ⏳ **他ユーザープロフィール画面**: Backend準備済み、Frontend未実装
- ⏳ **通知機能**: データベース設計済み、API・通知生成ロジック未実装
- ⏳ **暴言フィルター**: データベース設計済み、フィルタリングロジック未実装
- ⏳ **通報機能**: データベース設計済み、API未実装
- ⏳ **タイムライン拡張**: フォロー中タブ未実装

#### フロントエンド実装予定
- 📱 フォローボタンコンポーネント
- 📱 タイムラインタブ切り替え（おすすめ/フォロー中）
- 📱 フォロー・フォロワー一覧ページ
- 📱 他ユーザープロフィールページ
- 📱 いいねボタンコンポーネント
- 📱 アバターアップロードUI
- 📱 通知ページ・バッジ
- 📱 通報モーダル

### データフロー
1. ユーザー登録 → Supabase Authでアカウント作成
2. プロフィール設定 → Backend APIでユーザー情報保存
3. 投稿/リプライ → Backend API → PostgreSQL（スナップショット情報付き）
4. タイムライン取得 → ステータスに基づくフィルタリング
5. フォロー関係 → カウント自動更新

## 🐛 トラブルシューティング

### よくある問題

1. **「Invalid authentication credentials」エラー**
   - JWT Secretが正しく設定されているか確認
   - Supabase Anon Keyが正しいか確認

2. **CORS エラー**
   - Backend の `CORS_ORIGINS` に `http://localhost:3000` が含まれているか確認

3. **データベース接続エラー**
   - DATABASE_URLが正しいか確認
   - Supabaseダッシュボードでデータベースが起動しているか確認

4. **マイグレーションエラー**
   - DATABASE_URLの末尾に `?sslmode=require` を追加してみる

## 📚 プロジェクト詳細

### Backend ドキュメント
- **メインREADME**: [backend/README.md](backend/README.md)
- **API層**: [backend/api/README.md](backend/api/README.md)
- **機能別API**: [backend/api/features/README.md](backend/api/features/README.md)
- **モデル層**: [backend/packages/models/README.md](backend/packages/models/README.md)
- **マイグレーション**: [backend/packages/db/migrations/README.md](backend/packages/db/migrations/README.md)

### Frontend ドキュメント
- **メインREADME**: [frontend/README.md](frontend/README.md)

## 📋 Phase 2 実装進捗

### 完了項目
1. **データベース設計・マイグレーション**
   - `follows` テーブル：フォロー関係管理
   - `likes` テーブル：投稿いいね管理
   - `notifications` テーブル：通知管理
   - `banned_words` テーブル：暴言フィルター
   - `reports` テーブル：通報管理
   - `users` テーブル：avatar_url, followers_count, following_count追加
   - `posts` テーブル：author_avatar_url, likes_count追加

2. **フォロー機能（Backend）**
   - Follow Model/Repository/Service 実装
   - Follow API エンドポイント実装
   - フォロー関係のCRUD操作
   - フォロー数カウント自動更新
   - フォロワー・フォロー中一覧（ペジネーション対応）

### 次のステップ
1. **いいね機能実装**
2. **アバターアップロード機能**
3. **フロントエンド実装（フォロー機能）**
4. **通知システム実装**
5. **コンテンツフィルタリング実装**

### API仕様（Phase 2追加分）

#### フォロー機能
```
POST   /api/v1/users/{user_id}/follow         # フォローする
DELETE /api/v1/users/{user_id}/follow         # フォロー解除
GET    /api/v1/users/{user_id}/follow-status  # フォロー状態確認
GET    /api/v1/users/{user_id}/followers      # フォロワー一覧
GET    /api/v1/users/{user_id}/following      # フォロー中一覧
```

## 🔒 セキュリティ

- Supabase Row Level Security (RLS) は現在無効
- 認証はJWT検証でバックエンド側で実装
- 本番環境では必ずHTTPS化すること