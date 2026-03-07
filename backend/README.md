# LoveTalk API

恋愛相談SNS「LoveTalk」のバックエンドAPI

## アーキテクチャ

### ディレクトリ構成

```
backend/
├── api/                     # APIレイヤー
│   ├── main.py             # FastAPIアプリ初期化
│   ├── config/             # 環境変数・設定管理
│   │   └── settings.py
│   ├── core/               # 共通機能
│   │   └── dependencies.py # JWT検証・DBセッション
│   └── features/           # 機能別API実装
│       ├── health/         # ヘルスチェック
│       ├── users/          # ユーザー管理
│       ├── posts/          # 投稿管理
│       └── replies/        # リプライ管理
│
├── packages/               # ドメイン・インフラレイヤー
│   ├── models/            # SQLModelテーブル定義
│   ├── repositories/      # DB操作層
│   ├── services/          # ビジネスロジック層
│   └── db/                # DB接続・マイグレーション
│       └── migrations/
│
└── tests/                  # テストコード
```

### 各featureの3層構造

```
features/[feature_name]/
├── router.py       # FastAPIルーター（エンドポイント定義）
├── usecase.py      # ユースケース層（ビジネスロジック）
└── schemas.py      # Pydanticスキーマ（入出力定義）
```

## 環境構築

### 必要要件

- Python 3.11+
- PostgreSQL 14+

### セットアップ

1. 依存パッケージインストール
```bash
make install
```

2. 環境変数設定
```bash
cp .env.example .env
# .envを編集してSupabaseとDBの接続情報を設定
```

3. DBマイグレーション実行
```bash
make migrate
```

4. 開発サーバー起動
```bash
make dev
```

## コマンド一覧

| コマンド | 説明 |
|---------|------|
| `make install` | 依存パッケージのインストール |
| `make dev` | 開発サーバー起動 (http://localhost:8000) |
| `make lint` | コードチェック (ruff + mypy) |
| `make fmt` | コードフォーマット |
| `make fix` | 自動修正可能なエラーを修正 |
| `make test` | テスト実行 |
| `make migrate` | マイグレーション実行 |
| `make migrate-create name="xxx"` | 新規マイグレーション作成 |
| `make gen-openapi` | OpenAPIスキーマ生成 |

## 環境変数

| 変数名 | 説明 | 例 |
|--------|------|-----|
| `SUPABASE_URL` | SupabaseプロジェクトURL | https://xxxxx.supabase.co |
| `SUPABASE_ANON_KEY` | Supabase Anonymous Key | eyJhbGci... |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role Key | eyJhbGci... |
| `SUPABASE_JWT_SECRET` | JWT検証用シークレット | your-jwt-secret |
| `DATABASE_URL` | PostgreSQL接続URL | postgresql+asyncpg://... |
| `ENV` | 実行環境 | development/staging/production |
| `DEBUG` | デバッグモード | true/false |
| `CORS_ORIGINS` | CORS許可オリジン | http://localhost:3000 |

## API仕様

APIドキュメントは開発サーバー起動後、以下のURLで確認可能:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc