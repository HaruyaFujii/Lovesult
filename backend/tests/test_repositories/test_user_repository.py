"""
User repository tests
"""

from uuid import uuid4

import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from packages.models.user import AgeRange, Gender, User, UserStatus
from packages.repositories.user_repository import UserRepository


class TestUserRepository:
    """Test class for UserRepository database operations"""

    @pytest.fixture
    async def user_repository(self, async_session: AsyncSession):
        """Create user repository with async session"""
        return UserRepository(async_session)

    @pytest.fixture
    def sample_user_data(self):
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

    @pytest.mark.asyncio
    async def test_create_user_success(
        self, user_repository: UserRepository, async_session: AsyncSession, sample_user_data: dict
    ):
        """Test successful user creation"""
        # Execute
        user = await user_repository.create(sample_user_data)

        # Assert
        assert user.id == sample_user_data["id"]
        assert user.email == sample_user_data["email"]
        assert user.nickname == sample_user_data["nickname"]
        assert user.status == sample_user_data["status"]

        # Verify user was saved to database
        stmt = select(User).where(User.id == user.id)
        result = await async_session.execute(stmt)
        db_user = result.scalar_one_or_none()
        assert db_user is not None
        assert db_user.email == sample_user_data["email"]

    @pytest.mark.asyncio
    async def test_get_user_by_id_success(self, user_repository: UserRepository, test_user: User):
        """Test successful user retrieval by ID"""
        # Execute
        user = await user_repository.get_by_id(test_user.id)

        # Assert
        assert user is not None
        assert user.id == test_user.id
        assert user.email == test_user.email
        assert user.nickname == test_user.nickname

    @pytest.mark.asyncio
    async def test_get_user_by_id_not_found(self, user_repository: UserRepository):
        """Test user retrieval when user doesn't exist"""
        # Execute
        non_existent_id = str(uuid4())
        user = await user_repository.get_by_id(non_existent_id)

        # Assert
        assert user is None

    @pytest.mark.asyncio
    async def test_get_user_by_email_success(
        self, user_repository: UserRepository, test_user: User
    ):
        """Test successful user retrieval by email"""
        # Execute
        user = await user_repository.get_by_email(test_user.email)

        # Assert
        assert user is not None
        assert user.id == test_user.id
        assert user.email == test_user.email

    @pytest.mark.asyncio
    async def test_get_user_by_email_not_found(self, user_repository: UserRepository):
        """Test user retrieval by email when user doesn't exist"""
        # Execute
        user = await user_repository.get_by_email("nonexistent@example.com")

        # Assert
        assert user is None

    @pytest.mark.asyncio
    async def test_update_user_success(
        self, user_repository: UserRepository, test_user: User, async_session: AsyncSession
    ):
        """Test successful user update"""
        # Setup
        update_data = {
            "nickname": "更新されたニックネーム",
            "bio": "更新された自己紹介",
            "status": UserStatus.IN_LOVE,
        }

        # Execute
        updated_user = await user_repository.update(test_user.id, update_data)

        # Assert
        assert updated_user.nickname == update_data["nickname"]
        assert updated_user.bio == update_data["bio"]
        assert updated_user.status == update_data["status"]
        assert updated_user.id == test_user.id  # ID should remain same

        # Verify changes were persisted
        await async_session.refresh(updated_user)
        assert updated_user.nickname == update_data["nickname"]

    @pytest.mark.asyncio
    async def test_update_user_not_found(self, user_repository: UserRepository):
        """Test updating non-existent user"""
        # Execute
        non_existent_id = str(uuid4())
        update_data = {"nickname": "新しいニックネーム"}
        result = await user_repository.update(non_existent_id, update_data)

        # Assert
        assert result is None

    @pytest.mark.asyncio
    async def test_delete_user_success(
        self, user_repository: UserRepository, test_user: User, async_session: AsyncSession
    ):
        """Test successful user deletion"""
        # Execute
        await user_repository.delete(test_user.id)

        # Assert - user should be removed from database
        stmt = select(User).where(User.id == test_user.id)
        result = await async_session.execute(stmt)
        db_user = result.scalar_one_or_none()
        assert db_user is None

    @pytest.mark.asyncio
    async def test_delete_user_not_found(self, user_repository: UserRepository):
        """Test deleting non-existent user"""
        # Execute - should not raise exception
        non_existent_id = str(uuid4())
        await user_repository.delete(non_existent_id)
        # Test passes if no exception is raised

    @pytest.mark.asyncio
    async def test_get_filtered_users(
        self, user_repository: UserRepository, async_session: AsyncSession
    ):
        """Test getting users with filters"""
        # Setup - create multiple users with different attributes
        users_data = [
            {
                "id": str(uuid4()),
                "email": "user1@example.com",
                "nickname": "User1",
                "status": UserStatus.SEEKING,
                "gender": Gender.MALE,
                "age_range": AgeRange.TWENTIES,
            },
            {
                "id": str(uuid4()),
                "email": "user2@example.com",
                "nickname": "User2",
                "status": UserStatus.SEEKING,
                "gender": Gender.FEMALE,
                "age_range": AgeRange.TWENTIES,
            },
            {
                "id": str(uuid4()),
                "email": "user3@example.com",
                "nickname": "User3",
                "status": UserStatus.IN_LOVE,
                "gender": Gender.MALE,
                "age_range": AgeRange.THIRTIES,
            },
        ]

        for user_data in users_data:
            user = User(**user_data)
            async_session.add(user)
        await async_session.commit()

        # Execute - filter by status and age_range
        filters = {
            "status": UserStatus.SEEKING,
            "age_range": AgeRange.TWENTIES,
            "limit": 10,
            "offset": 0,
        }
        result = await user_repository.get_filtered_users(filters)

        # Assert
        assert len(result) == 2  # Should find users 1 and 2
        for user in result:
            assert user.status == UserStatus.SEEKING
            assert user.age_range == AgeRange.TWENTIES

    @pytest.mark.asyncio
    async def test_get_filtered_users_with_pagination(
        self, user_repository: UserRepository, async_session: AsyncSession
    ):
        """Test getting users with pagination"""
        # Setup - create multiple users
        users_data = []
        for i in range(5):
            users_data.append(
                {
                    "id": str(uuid4()),
                    "email": f"user{i}@example.com",
                    "nickname": f"User{i}",
                    "status": UserStatus.SEEKING,
                    "gender": Gender.MALE,
                    "age_range": AgeRange.TWENTIES,
                }
            )

        for user_data in users_data:
            user = User(**user_data)
            async_session.add(user)
        await async_session.commit()

        # Execute - test pagination
        filters = {
            "status": UserStatus.SEEKING,
            "limit": 2,
            "offset": 0,
        }
        page1 = await user_repository.get_filtered_users(filters)

        filters["offset"] = 2
        page2 = await user_repository.get_filtered_users(filters)

        # Assert
        assert len(page1) == 2
        assert len(page2) == 2
        # Ensure different users in each page
        page1_ids = {user.id for user in page1}
        page2_ids = {user.id for user in page2}
        assert page1_ids.isdisjoint(page2_ids)

    @pytest.mark.asyncio
    async def test_get_user_statistics(self, user_repository: UserRepository, test_user: User):
        """Test getting user statistics"""
        # Execute
        stats = await user_repository.get_user_statistics(test_user.id)

        # Assert - stats should be a dictionary with expected keys
        assert isinstance(stats, dict)
        expected_keys = ["posts_count", "followers_count", "following_count"]
        for key in expected_keys:
            assert key in stats
            assert isinstance(stats[key], int)
            assert stats[key] >= 0

    @pytest.mark.asyncio
    async def test_search_users_by_nickname(
        self, user_repository: UserRepository, async_session: AsyncSession
    ):
        """Test searching users by nickname"""
        # Setup - create users with searchable nicknames
        users_data = [
            {
                "id": str(uuid4()),
                "email": "search1@example.com",
                "nickname": "山田太郎",
                "status": UserStatus.SEEKING,
            },
            {
                "id": str(uuid4()),
                "email": "search2@example.com",
                "nickname": "田中花子",
                "status": UserStatus.SEEKING,
            },
            {
                "id": str(uuid4()),
                "email": "search3@example.com",
                "nickname": "佐藤次郎",
                "status": UserStatus.SEEKING,
            },
        ]

        for user_data in users_data:
            user = User(**user_data)
            async_session.add(user)
        await async_session.commit()

        # Execute - search for users containing "田"
        search_term = "田"
        result = await user_repository.search_users(search_term, limit=10)

        # Assert
        assert len(result) == 2  # Should find 山田太郎 and 田中花子
        for user in result:
            assert search_term in user.nickname
