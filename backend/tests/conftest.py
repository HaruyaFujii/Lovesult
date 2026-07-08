"""
Test configuration and fixtures
"""

import asyncio
from collections.abc import AsyncGenerator
from datetime import UTC, datetime, timedelta
from uuid import uuid4

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from jose import jwt as jose_jwt
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.pool import StaticPool
from sqlmodel import SQLModel

from api.config import get_settings
from api.core.dependencies import get_db
from api.main import app
from packages.models.post import Post
from packages.models.user import AgeRange, Gender, User, UserStatus

# Test database setup: in-memory SQLite is preferred so a stale file cannot pollute runs.
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest_asyncio.fixture
async def async_engine():
    """Create async engine for testing"""
    engine = create_async_engine(
        TEST_DATABASE_URL,
        echo=False,
        poolclass=StaticPool,
        connect_args={"check_same_thread": False},
    )

    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)

    yield engine

    # Cleanup
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.drop_all)

    await engine.dispose()


@pytest_asyncio.fixture
async def async_session(async_engine) -> AsyncGenerator[AsyncSession, None]:
    """Create async session for testing"""
    async with AsyncSession(async_engine, expire_on_commit=False) as session:
        yield session


@pytest_asyncio.fixture
async def override_get_session(async_session):
    """Override the FastAPI DB dependency so tests share the fixture session.

    Routers depend on ``get_db``, which is an async generator. The override must
    return the same async-generator shape or FastAPI will raise on ``__aiter__``.
    """

    async def _override() -> AsyncGenerator[AsyncSession, None]:
        yield async_session

    app.dependency_overrides[get_db] = _override
    yield
    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def client(override_get_session) -> AsyncGenerator[AsyncClient, None]:
    """Create test client.

    httpx>=0.28 removed the ``app=`` kwarg from ``AsyncClient``; the ASGI app
    must be wired via ``ASGITransport`` instead.
    """
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac


# Test data fixtures
@pytest.fixture
def sample_user_data():
    """Sample user data for testing"""
    return {
        "id": str(uuid4()),
        "email": "test@example.com",
        "nickname": "テストユーザー",
        "status": UserStatus.SEEKING,
        "gender": Gender.MALE,
        "age_range": AgeRange.TWENTIES,
        "bio": "これはテストユーザーです",
    }


@pytest_asyncio.fixture
async def test_user(async_session: AsyncSession, sample_user_data) -> User:
    """Create a test user in database"""
    user = User(**sample_user_data)
    async_session.add(user)
    await async_session.commit()
    await async_session.refresh(user)
    return user


@pytest_asyncio.fixture
async def another_test_user(async_session: AsyncSession) -> User:
    """Create another test user in database"""
    user_data = {
        "id": str(uuid4()),
        "email": "test2@example.com",
        "nickname": "テストユーザー2",
        "status": UserStatus.IN_LOVE,
        "gender": Gender.FEMALE,
        "age_range": AgeRange.THIRTIES,
        "bio": "これは2番目のテストユーザーです",
    }
    user = User(**user_data)
    async_session.add(user)
    await async_session.commit()
    await async_session.refresh(user)
    return user


@pytest_asyncio.fixture
async def test_post(async_session: AsyncSession, test_user: User) -> Post:
    """Create a test post in database"""
    post_data = {
        "id": str(uuid4()),
        "user_id": test_user.id,
        "content": "これはテスト投稿です",
        "author_status": test_user.status,
        "author_age_range": test_user.age_range,
    }
    post = Post(**post_data)
    async_session.add(post)
    await async_session.commit()
    await async_session.refresh(post)
    return post


@pytest.fixture
def auth_headers(test_user: User):
    """Authorization headers with a locally-signed JWT for the test user.

    verify_jwt_token now performs local HS256 decoding, so we need to hand it a
    token signed with the configured supabase_jwt_secret. Audience must match.
    """
    settings = get_settings()
    payload = {
        "sub": str(test_user.id),
        "email": test_user.email,
        "aud": "authenticated",
        "exp": datetime.now(tz=UTC) + timedelta(hours=1),
    }
    token = jose_jwt.encode(payload, settings.supabase_jwt_secret, algorithm="HS256")
    return {"Authorization": f"Bearer {token}"}


# Event loop fixture for pytest-asyncio
@pytest.fixture(scope="session")
def event_loop():
    """Create event loop for testing"""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()
