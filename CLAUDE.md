# Lovesult

恋愛ステータス x 性格診断のマッチングSNS。`backend/` (FastAPI + SQLModel + Supabase) と `frontend/` (Next.js 16 App Router + shadcn/ui) のモノレポ。

## Commands

```bash
# backend (backend/ ディレクトリで実行)
make install        # uv sync --dev
make dev            # uvicorn 起動 (port 8000, --reload)
make lint           # ruff check + mypy
make fmt            # ruff format
make fix            # ruff check --fix
make test           # pytest
make migrate        # alembic upgrade head
make migrate-create name="add_xxx_table"  # マイグレーション生成
make gen            # openapi.json を frontend/app/lib/api/openapi.json に出力
```

```bash
# frontend (frontend/ ディレクトリで実行)
yarn dev            # 開発サーバー起動
yarn build          # プロダクションビルド
yarn lint           # ESLint (max-warnings 0)
yarn fmt            # Prettier --write
yarn type-check     # tsc --noEmit
yarn gen            # Orval で API クライアント再生成
```

## API型同期(重要)

backend の API / スキーマを変更したら必ず実行:

```bash
cd backend && make gen && cd ../frontend && yarn gen && yarn type-check
```

詳細手順は `.claude/skills/sync-api/SKILL.md` 参照。

## 絶対ルール

- `frontend/app/lib/api/generated/**` と `openapi.json` は手編集禁止(Orval 生成物)
- DM 機能はフロントで意図的に無効化中(電気通信事業法の届出未了)。指示なく再有効化しない
- 認証必須エンドポイントは `Depends(get_current_user_id)` を使う (`api/core/dependencies.py`)
- コード変更後は backend: `make lint && make test` / frontend: `yarn lint && yarn type-check` で検証。コミット前に `make fmt` / `yarn fmt` を実行

## アーキテクチャ

backend は Router → UseCase → Service → Repository → Model の階層構造。DB 接続は `packages/db/session.py`、認証依存は `api/core/dependencies.py`。

機能追加・画面追加・マイグレーション・API 同期の詳細手順は `.claude/skills/` の各スキル (`backend-feature`, `frontend-feature`, `db-migration`, `sync-api`) を参照。
