from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.config import get_settings
from api.features.health import router as health_router
from api.features.posts import router as posts_router
from api.features.replies import router as replies_router
from api.features.users import router as users_router
from api.features.follows.router import router as follows_router
from api.features.likes.router import router as likes_router
from api.features.notifications.router import router as notifications_router
from api.features.reports import router as reports_router
from api.features.search.router import router as search_router
from api.features.account.router import router as account_router
from api.features.dm.router import router as dm_router
from api.features.personality.router import router as personality_router

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator:
    # Startup
    print("Starting up LoveTalk API...")
    yield
    # Shutdown
    print("Shutting down LoveTalk API...")


app = FastAPI(
    title="LoveTalk API",
    description="恋愛相談SNS「LoveTalk」のバックエンドAPI",
    version="0.1.0",
    lifespan=lifespan,
    debug=settings.debug,
)

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if settings.env == "development" else settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ルーター登録
app.include_router(health_router, prefix="/api/v1")
app.include_router(users_router, prefix="/api/v1")
app.include_router(posts_router, prefix="/api/v1")
app.include_router(replies_router, prefix="/api/v1")
app.include_router(follows_router, prefix="/api/v1")
app.include_router(likes_router, prefix="/api/v1")
app.include_router(notifications_router, prefix="/api/v1")
app.include_router(reports_router, prefix="/api/v1")
app.include_router(search_router, prefix="/api/v1")
app.include_router(account_router, prefix="/api/v1")
app.include_router(dm_router, prefix="/api/v1")
app.include_router(personality_router, prefix="/api/v1")