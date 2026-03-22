from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlmodel import SQLModel

from api.config import get_settings

settings = get_settings()

engine = create_async_engine(
    settings.database_url,
    echo=False,  # プロダクションでは無効化
    future=True,
    pool_size=20,  # 接続プールサイズを増やす
    max_overflow=40,  # オーバーフロー接続を増やす
    pool_pre_ping=True,  # 接続の健全性チェック
    pool_recycle=3600,  # 1時間で接続をリサイクル
    connect_args={
        "statement_cache_size": 0,  # Transaction pooler対応
        "prepared_statement_cache_size": 0,
        "server_settings": {
            "jit": "off",  # JITを無効化してパフォーマンス安定化
        },
    },
)

async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,  # 手動でflushを制御
    autocommit=False,
)


async def init_db() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        yield session
