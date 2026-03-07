# Database

データベース接続とマイグレーション管理

## ファイル構成

```
db/
├── session.py       # DB接続とセッション管理
└── migrations/      # Alembicマイグレーション
    ├── env.py       # Alembic環境設定
    ├── script.py.mako  # マイグレーションテンプレート
    └── versions/    # マイグレーションファイル
```

## session.py

### AsyncEngineとSessionMaker
```python
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

engine = create_async_engine(
    settings.database_url,
    echo=settings.debug,  # デバッグ時はSQL表示
    future=True,
)

async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)
```

### セッション取得
```python
async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        yield session
```

## マイグレーション

詳細は [migrations/README.md](migrations/README.md) を参照

### 基本コマンド

```bash
# マイグレーション実行
make migrate

# 新規マイグレーション作成
make migrate-create name="add_new_table"

# マイグレーション履歴確認
alembic history

# ロールバック（1つ前に戻る）
alembic downgrade -1
```

## 接続文字列

### Supabase接続の注意点

```
postgresql+asyncpg://postgres.PROJECT_ID:PASSWORD@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres
```

- `postgresql+asyncpg://` - 非同期ドライバを使用
- `pooler.supabase.com` - コネクションプーリング使用
- ポート `6543` - Poolerポート（直接接続は5432）

### SSL接続

本番環境では `?sslmode=require` を追加：
```
DATABASE_URL=postgresql+asyncpg://...?sslmode=require
```