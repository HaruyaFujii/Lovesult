"""
Test configuration and fixtures
"""

import asyncio
from collections.abc import AsyncGenerator
from uuid import uuid4

import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.pool import StaticPool
from sqlmodel import SQLModel

from api.core.dependencies import get_session
from api.main import app
from packages.models.post import Post
from packages.models.user import AgeRange, Gender, User, UserStatus

# Test database setup
TEST_DATABASE_URL = "sqlite+aiosqlite:///./test.db"


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
    """Override the get_session dependency"""

    def _override():
        return async_session

    app.dependency_overrides[get_session] = _override
    yield
    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def client(override_get_session) -> AsyncGenerator[AsyncClient, None]:
    """Create test client"""
    async with AsyncClient(app=app, base_url="http://test") as ac:
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
def auth_headers():
    """Mock authorization headers"""
    return {"Authorization": "Bearer test-token"}


# Event loop fixture for pytest-asyncio
@pytest.fixture(scope="session")
def event_loop():
    """Create event loop for testing"""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()
