# Lovesult Backend API

FastAPI + SQLModel + Alembic によるマッチングSNS バックエンドAPI

## 🏗 アーキテクチャ

### 技術スタック
- **Framework**: FastAPI 0.115.6
- **ORM**: SQLModel 0.0.22
- **Database**: PostgreSQL 14+ (Supabase)
- **Migration**: Alembic 1.14.0
- **Authentication**: Supabase Auth (JWT)
- **Package Manager**: uv 0.5.19
- **Linter/Formatter**: Ruff + MyPy

### クリーンアーキテクチャ設計

```
API Layer (Router → UseCase → Schema)
    ↓
Service Layer (Business Logic)
    ↓
Repository Layer (Data Access)
    ↓
Model Layer (SQLModel Tables)
```

### ディレクトリ構成

```
backend/
├── api/                        # APIレイヤー
│   ├── main.py                # FastAPIアプリエントリーポイント
│   ├── config/                # 環境設定
│   │   └── settings.py        # 設定管理
│   ├── core/                  # 共通機能
│   │   ├── dependencies.py    # 依存性注入（JWT検証、DB接続）
│   │   └── security.py        # セキュリティ機能
│   └── features/              # 機能別API実装
│       ├── account/           # アカウント管理（サインアップ/ログイン）
│       ├── users/             # ユーザー管理
│       ├── posts/             # 投稿管理（リプライ統合）
│       ├── likes/             # いいね機能
│       ├── follows/           # フォロー機能
│       ├── notifications/     # 通知機能
│       ├── search/            # 検索機能
│       ├── reports/           # 通報機能
│       ├── dm/                # ダイレクトメッセージ
│       └── personality/       # 性格診断
├── packages/                   # ドメイン・インフラレイヤー
│   ├── models/                # SQLModelテーブル定義
│   │   ├── user.py            # ユーザーモデル
│   │   ├── post.py            # 投稿モデル（リプライ統合）
│   │   ├── like.py            # いいねモデル
│   │   ├── reply_like.py      # リプライいいねモデル
│   │   ├── follow.py          # フォローモデル
│   │   ├── notification.py    # 通知モデル
│   │   ├── report.py          # 通報モデル
│   │   ├── conversation.py    # DM会話モデル
│   │   ├── direct_message.py  # DMメッセージモデル
│   │   └── personality_result.py # 性格診断結果モデル
│   ├── repositories/          # データアクセス層
│   │   ├── user_repository.py
│   │   ├── post_repository.py
│   │   ├── like_repository.py
│   │   ├── follow_repository.py
│   │   ├── notification_repository.py
│   │   ├── report_repository.py
│   │   ├── conversation_repository.py
│   │   ├── message_repository.py
│   │   └── personality_repository.py
│   ├── services/              # ビジネスロジック層
│   │   ├── user_service.py
│   │   ├── post_service.py
│   │   ├── reply_service.py
│   │   ├── like_service.py
│   │   ├── follow_service.py
│   │   ├── notification_service.py
│   │   ├── timeline_service.py
│   │   ├── search_service.py
│   │   ├── dm_service.py
│   │   ├── personality_service.py
│   │   └── recommendation_service.py
│   └── db/                    # データベース設定
│       ├── database.py        # 接続管理
│       └── migrations/        # Alembicマイグレーション
│           └── versions/      # マイグレーションファイル
├── tests/                     # テストコード
│   ├── unit/                  # ユニットテスト
│   └── integration/           # 統合テスト
├── Makefile                   # 開発コマンド定義
├── pyproject.toml             # プロジェクト設定
├── uv.lock                    # 依存関係ロックファイル
└── .env                       # 環境変数

```

### 各featureの3層構造

各機能は以下の3ファイルで構成:

```python
features/[feature_name]/
├── router.py       # FastAPIルーター（エンドポイント定義）
├── usecase.py      # ユースケース層（ビジネスロジック集約）
└── schemas.py      # Pydanticスキーマ（リクエスト/レスポンス型定義）
```

## 🚀 セットアップ

### 必要要件
- Python 3.11+
- PostgreSQL 14+ (Supabase経由)
- uv (Pythonパッケージマネージャー)

### インストール手順

1. **uvのインストール**
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

2. **依存パッケージインストール**
```bash
make install
# または
uv sync --dev
```

3. **環境変数設定**
```bash
cp .env.example .env
```

`.env`を編集:
```env
# Supabase設定
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

4. **DBマイグレーション実行**
```bash
make migrate
# または
uv run alembic upgrade head
```

5. **開発サーバー起動**
```bash
make dev
# または
uv run uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
```

APIドキュメント: http://localhost:8000/docs

## 📋 開発コマンド

| コマンド | 説明 |
|---------|------|
| `make install` | 依存パッケージのインストール |
| `make dev` | 開発サーバー起動 (ホットリロード有効) |
| `make lint` | Ruff + MyPyによるコードチェック |
| `make fmt` | Ruffによるコードフォーマット |
| `make fix` | 自動修正可能なエラーを修正 |
| `make test` | Pytestでテスト実行 |
| `make migrate` | DBマイグレーション適用 |
| `make migrate-create name="xxx"` | 新規マイグレーション作成 |
| `make gen` | OpenAPIスキーマ生成 (frontend連携用) |

## 🔧 主要機能

### 実装済み機能

#### 基本機能
- ✅ **認証システム**: Supabase Auth JWT認証
- ✅ **ユーザー管理**: プロフィール、アバター、ステータス管理
- ✅ **恋愛ステータス**: IN_LOVE / HEARTBROKEN / SEEKING

#### 投稿機能
- ✅ **統合投稿管理**: 投稿とリプライを単一テーブルで管理
- ✅ **階層構造**: parent_id による無限階層ネスト
- ✅ **いいね機能**: 投稿・リプライ両対応（別テーブル）
- ✅ **タイムライン**: ステータス優先表示、フォロー中フィルター

#### ソーシャル機能
- ✅ **フォロー機能**: 相互フォロー管理
- ✅ **通知システム**: フォロー、いいね、リプライ通知
- ✅ **検索機能**: ユーザー・投稿検索（全文検索対応）

#### DM機能
- ✅ **会話管理**: 1対1メッセージング
- ✅ **未読管理**: last_read_at による既読管理
- ✅ **メッセージ取得**: カーソルページネーション

#### 性格診断
- ✅ **診断テスト**: 20問の質問
- ✅ **16タイプ分類**: MBTI風性格タイプ
- ✅ **レコメンデーション**: 相性の良いユーザー提案

#### モデレーション
- ✅ **通報機能**: 投稿・ユーザー通報
- ✅ **暴言フィルター**: banned_words テーブル

## 📊 データベース設計

### 主要テーブル

| テーブル名 | 説明 |
|-----------|------|
| `users` | ユーザー情報、プロフィール |
| `posts` | 投稿とリプライ（統合管理） |
| `likes` | 投稿へのいいね |
| `reply_likes` | リプライへのいいね |
| `follows` | フォロー関係 |
| `conversations` | DM会話 |
| `direct_messages` | DMメッセージ |
| `conversation_participants` | 会話参加者 |
| `notifications` | 通知 |
| `personality_results` | 性格診断結果 |
| `reports` | 通報情報 |
| `banned_words` | 禁止ワード |

### 投稿の階層構造
```sql
-- 投稿とリプライを単一テーブルで管理
posts (
    id UUID PRIMARY KEY,
    content TEXT,
    user_id UUID REFERENCES users(id),
    parent_id UUID REFERENCES posts(id),  -- NULLなら投稿、値があればリプライ
    root_id UUID,  -- 最上位の投稿ID（スレッド管理用）
    depth INTEGER,  -- ネストの深さ
    created_at TIMESTAMP
)
```

## 🔒 セキュリティ

### 認証・認可
- JWT Bearer Token認証
- Supabase Auth統合
- Service Role Key はバックエンドのみ

### データ検証
- Pydanticスキーマによる入力検証
- SQLModelによる型安全性
- 暴言フィルタリング

### CORS設定
- 環境変数で許可オリジン管理
- 開発環境: `http://localhost:3000`
- 本番環境: 実際のドメインのみ許可

## 🧪 テスト

### テスト実行
```bash
# 全テスト実行
make test

# カバレッジレポート付き
uv run pytest --cov=api --cov=packages

# 特定のテストのみ
uv run pytest tests/unit/test_user_service.py
```

### テスト構成
```
tests/
├── unit/           # ユニットテスト
│   ├── services/   # サービス層テスト
│   └── repositories/ # リポジトリ層テスト
└── integration/    # 統合テスト
    └── api/        # APIエンドポイントテスト
```

## 🐛 トラブルシューティング

### よくある問題

1. **マイグレーションエラー**
```bash
# 現在のリビジョン確認
uv run alembic current

# ヘッド確認
uv run alembic heads

# 強制的に最新に更新
uv run alembic stamp head
```

2. **MyPyエラー**
```bash
# SQLAlchemy関連の型エラーは既知の問題
# 必要に応じて # type: ignore を使用
```

3. **CORS エラー**
```bash
# .envのCORS_ORIGINSを確認
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

4. **JWT認証エラー**
```bash
# SUPABASE_JWT_SECRETが正しいか確認
# Supabase Dashboard > Settings > API > JWT Settings
```

## 🚀 デプロイ

### Docker
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# uvインストール
RUN pip install uv

# 依存関係インストール
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen

# アプリケーションコピー
COPY . .

# マイグレーション実行 & サーバー起動
CMD ["sh", "-c", "uv run alembic upgrade head && uv run uvicorn api.main:app --host 0.0.0.0 --port 8000"]
```

### 環境変数管理
- 開発: `.env`ファイル
- 本番: 環境変数またはシークレット管理サービス

## 📝 開発ガイドライン

### コード規約
- Ruffによる自動フォーマット
- MyPyによる型チェック
- 関数は型ヒント必須
- Docstring推奨（Google Style）

### コミット規約
```
feat: 新機能追加
fix: バグ修正
refactor: リファクタリング
docs: ドキュメント更新
test: テスト追加・修正
chore: ビルド・設定変更
perf: パフォーマンス改善
```

### API設計原則
- RESTful設計
- 適切なHTTPステータスコード
- エラーレスポンス統一
- ページネーション実装

### パフォーマンス最適化
- SQLAlchemy selectinloadによるN+1問題回避
- 非同期処理 (asyncio)
- コネクションプール管理
- インデックス最適化

## 📄 ライセンス

プロプライエタリ - 無断での使用・複製・配布を禁止します