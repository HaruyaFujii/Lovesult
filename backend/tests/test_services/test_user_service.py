"""
User service layer tests
"""

from unittest.mock import AsyncMock
from uuid import uuid4

import pytest

from packages.models.user import AgeRange, Gender, User, UserStatus
from packages.repositories.user_repository import UserRepository
from packages.services.user_service import UserService


class TestUserService:
    """Test class for UserService business logic"""

    @pytest.fixture
    def mock_user_repository(self):
        """Create mock user repository"""
        return AsyncMock(spec=UserRepository)

    @pytest.fixture
    def user_service(self, mock_user_repository):
        """Create user service with mocked dependencies"""
        return UserService(repository=mock_user_repository)

    @pytest.fixture
    def sample_user(self):
        """Sample user for testing"""
        return User(
            id=str(uuid4()),
            email="test@example.com",
            nickname="テストユーザー",
            status=UserStatus.SEEKING,
            gender=Gender.MALE,
            age_range=AgeRange.TWENTIES,
            bio="これはテストです",
        )

    @pytest.mark.asyncio
    async def test_get_user_by_id_success(
        self, user_service: UserService, mock_user_repository: AsyncMock, sample_user: User
    ):
        """Test successful user retrieval by ID"""
        # Setup
        mock_user_repository.get_by_id.return_value = sample_user

        # Execute
        result = await user_service.get_user_by_id(sample_user.id)

        # Assert
        assert result == sample_user
        mock_user_repository.get_by_id.assert_called_once_with(sample_user.id)

    @pytest.mark.asyncio
    async def test_get_user_by_id_not_found(
        self, user_service: UserService, mock_user_repository: AsyncMock
    ):
        """Test user retrieval when user doesn't exist"""
        # Setup
        user_id = str(uuid4())
        mock_user_repository.get_by_id.return_value = None

        # Execute & Assert
        with pytest.raises(ValueError, match="User not found"):
            await user_service.get_user_by_id(user_id)

        mock_user_repository.get_by_id.assert_called_once_with(user_id)

    @pytest.mark.asyncio
    async def test_create_user_success(
        self, user_service: UserService, mock_user_repository: AsyncMock, sample_user: User
    ):
        """Test successful user creation"""
        # Setup
        mock_user_repository.create.return_value = sample_user
        mock_user_repository.get_by_email.return_value = None  # Email not taken

        user_data = {
            "email": sample_user.email,
            "nickname": sample_user.nickname,
            "status": sample_user.status,
            "gender": sample_user.gender,
            "age_range": sample_user.age_range,
            "bio": sample_user.bio,
        }

        # Execute
        result = await user_service.create_user(user_data)

        # Assert
        assert result == sample_user
        mock_user_repository.get_by_email.assert_called_once_with(sample_user.email)
        mock_user_repository.create.assert_called_once()

    @pytest.mark.asyncio
    async def test_create_user_email_already_exists(
        self, user_service: UserService, mock_user_repository: AsyncMock, sample_user: User
    ):
        """Test user creation when email already exists"""
        # Setup
        mock_user_repository.get_by_email.return_value = sample_user  # Email taken

        user_data = {
            "email": sample_user.email,
            "nickname": "Different User",
        }

        # Execute & Assert
        with pytest.raises(ValueError, match="Email already registered"):
            await user_service.create_user(user_data)

        mock_user_repository.get_by_email.assert_called_once_with(sample_user.email)
        mock_user_repository.create.assert_not_called()

    @pytest.mark.asyncio
    async def test_update_user_success(
        self, user_service: UserService, mock_user_repository: AsyncMock, sample_user: User
    ):
        """Test successful user update"""
        # Setup
        updated_user = User(**sample_user.model_dump())
        updated_user.nickname = "更新されたニックネーム"
        updated_user.bio = "更新された自己紹介"

        mock_user_repository.get_by_id.return_value = sample_user
        mock_user_repository.update.return_value = updated_user

        update_data = {
            "nickname": "更新されたニックネーム",
            "bio": "更新された自己紹介",
        }

        # Execute
        result = await user_service.update_user(sample_user.id, update_data)

        # Assert
        assert result.nickname == "更新されたニックネーム"
        assert result.bio == "更新された自己紹介"
        mock_user_repository.get_by_id.assert_called_once_with(sample_user.id)
        mock_user_repository.update.assert_called_once()

    @pytest.mark.asyncio
    async def test_update_user_not_found(
        self, user_service: UserService, mock_user_repository: AsyncMock
    ):
        """Test updating non-existent user"""
        # Setup
        user_id = str(uuid4())
        mock_user_repository.get_by_id.return_value = None

        update_data = {"nickname": "新しいニックネーム"}

        # Execute & Assert
        with pytest.raises(ValueError, match="User not found"):
            await user_service.update_user(user_id, update_data)

        mock_user_repository.get_by_id.assert_called_once_with(user_id)
        mock_user_repository.update.assert_not_called()

    @pytest.mark.asyncio
    async def test_delete_user_success(
        self, user_service: UserService, mock_user_repository: AsyncMock, sample_user: User
    ):
        """Test successful user deletion"""
        # Setup
        mock_user_repository.get_by_id.return_value = sample_user
        mock_user_repository.delete.return_value = None

        # Execute
        await user_service.delete_user(sample_user.id)

        # Assert
        mock_user_repository.get_by_id.assert_called_once_with(sample_user.id)
        mock_user_repository.delete.assert_called_once_with(sample_user.id)

    @pytest.mark.asyncio
    async def test_get_users_with_filters(
        self, user_service: UserService, mock_user_repository: AsyncMock
    ):
        """Test getting users with filters applied"""
        # Setup
        users = [
            User(
                id=str(uuid4()),
                email="user1@example.com",
                nickname="User1",
                status=UserStatus.SEEKING,
                age_range=AgeRange.TWENTIES,
            ),
            User(
                id=str(uuid4()),
                email="user2@example.com",
                nickname="User2",
                status=UserStatus.SEEKING,
                age_range=AgeRange.TWENTIES,
            ),
        ]
        mock_user_repository.get_filtered_users.return_value = users

        filters = {
            "status": UserStatus.SEEKING,
            "age_range": AgeRange.TWENTIES,
            "limit": 10,
            "offset": 0,
        }

        # Execute
        result = await user_service.get_users_with_filters(filters)

        # Assert
        assert result == users
        mock_user_repository.get_filtered_users.assert_called_once_with(filters)

    @pytest.mark.asyncio
    async def test_validate_user_data(self, user_service: UserService):
        """Test user data validation"""
        # Test valid data
        valid_data = {
            "email": "test@example.com",
            "nickname": "ValidNickname",
            "status": UserStatus.SEEKING,
        }

        # Should not raise exception
        await user_service._validate_user_data(valid_data)

        # Test invalid email
        invalid_data = {
            "email": "invalid-email",
            "nickname": "ValidNickname",
        }

        with pytest.raises(ValueError, match="Invalid email format"):
            await user_service._validate_user_data(invalid_data)

        # Test empty nickname
        invalid_data = {
            "email": "test@example.com",
            "nickname": "",
        }

        with pytest.raises(ValueError, match="Nickname cannot be empty"):
            await user_service._validate_user_data(invalid_data)

    @pytest.mark.asyncio
    async def test_user_statistics(
        self, user_service: UserService, mock_user_repository: AsyncMock, sample_user: User
    ):
        """Test getting user statistics"""
        # Setup
        stats = {
            "posts_count": 10,
            "followers_count": 5,
            "following_count": 8,
        }
        mock_user_repository.get_user_statistics.return_value = stats

        # Execute
        result = await user_service.get_user_statistics(sample_user.id)

        # Assert
        assert result == stats
        mock_user_repository.get_user_statistics.assert_called_once_with(sample_user.id)
