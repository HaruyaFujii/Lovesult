"""
Post service layer tests
"""

from datetime import datetime
from unittest.mock import AsyncMock
from uuid import uuid4

import pytest

from packages.models.post import Post
from packages.models.user import AgeRange, User, UserStatus
from packages.repositories.post_repository import PostRepository
from packages.services.post_service import PostService


class TestPostService:
    """Test class for PostService business logic"""

    @pytest.fixture
    def mock_post_repository(self):
        """Create mock post repository"""
        return AsyncMock(spec=PostRepository)

    @pytest.fixture
    def post_service(self, mock_post_repository):
        """Create post service with mocked dependencies"""
        return PostService(repository=mock_post_repository)

    @pytest.fixture
    def sample_user(self):
        """Sample user for testing"""
        return User(
            id=str(uuid4()),
            email="test@example.com",
            nickname="テストユーザー",
            status=UserStatus.SEEKING,
            age_range=AgeRange.TWENTIES,
        )

    @pytest.fixture
    def sample_post(self, sample_user):
        """Sample post for testing"""
        return Post(
            id=str(uuid4()),
            user_id=sample_user.id,
            content="これはテスト投稿です",
            author_status=sample_user.status,
            author_age_range=sample_user.age_range,
            created_at=datetime.utcnow(),
        )

    @pytest.mark.asyncio
    async def test_create_post_success(
        self,
        post_service: PostService,
        mock_post_repository: AsyncMock,
        sample_user: User,
        sample_post: Post,
    ):
        """Test successful post creation"""
        # Setup
        mock_post_repository.create.return_value = sample_post

        post_data = {
            "content": "これはテスト投稿です",
            "user_id": sample_user.id,
        }

        # Execute
        result = await post_service.create_post(post_data, sample_user)

        # Assert
        assert result == sample_post
        mock_post_repository.create.assert_called_once()

    @pytest.mark.asyncio
    async def test_create_post_empty_content(self, post_service: PostService, sample_user: User):
        """Test post creation with empty content"""
        post_data = {
            "content": "",
            "user_id": sample_user.id,
        }

        # Execute & Assert
        with pytest.raises(ValueError, match="Post content cannot be empty"):
            await post_service.create_post(post_data, sample_user)

    @pytest.mark.asyncio
    async def test_create_post_content_too_long(self, post_service: PostService, sample_user: User):
        """Test post creation with content exceeding limit"""
        post_data = {
            "content": "a" * 1001,  # Assuming 1000 character limit
            "user_id": sample_user.id,
        }

        # Execute & Assert
        with pytest.raises(ValueError, match="Post content too long"):
            await post_service.create_post(post_data, sample_user)

    @pytest.mark.asyncio
    async def test_create_reply_success(
        self,
        post_service: PostService,
        mock_post_repository: AsyncMock,
        sample_user: User,
        sample_post: Post,
    ):
        """Test successful reply creation"""
        # Setup
        reply = Post(
            id=str(uuid4()),
            user_id=sample_user.id,
            content="これは返信です",
            parent_id=sample_post.id,
            root_id=sample_post.id,
            author_status=sample_user.status,
            author_age_range=sample_user.age_range,
        )

        mock_post_repository.get_by_id.return_value = sample_post  # Parent exists
        mock_post_repository.create.return_value = reply

        reply_data = {
            "content": "これは返信です",
            "parent_id": sample_post.id,
            "user_id": sample_user.id,
        }

        # Execute
        result = await post_service.create_reply(reply_data, sample_user)

        # Assert
        assert result == reply
        mock_post_repository.get_by_id.assert_called_once_with(sample_post.id)
        mock_post_repository.create.assert_called_once()

    @pytest.mark.asyncio
    async def test_create_reply_parent_not_found(
        self, post_service: PostService, mock_post_repository: AsyncMock, sample_user: User
    ):
        """Test reply creation when parent post doesn't exist"""
        # Setup
        parent_id = str(uuid4())
        mock_post_repository.get_by_id.return_value = None

        reply_data = {
            "content": "これは返信です",
            "parent_id": parent_id,
            "user_id": sample_user.id,
        }

        # Execute & Assert
        with pytest.raises(ValueError, match="Parent post not found"):
            await post_service.create_reply(reply_data, sample_user)

    @pytest.mark.asyncio
    async def test_get_post_by_id_success(
        self, post_service: PostService, mock_post_repository: AsyncMock, sample_post: Post
    ):
        """Test successful post retrieval by ID"""
        # Setup
        mock_post_repository.get_by_id.return_value = sample_post

        # Execute
        result = await post_service.get_post_by_id(sample_post.id)

        # Assert
        assert result == sample_post
        mock_post_repository.get_by_id.assert_called_once_with(sample_post.id)

    @pytest.mark.asyncio
    async def test_get_post_by_id_not_found(
        self, post_service: PostService, mock_post_repository: AsyncMock
    ):
        """Test post retrieval when post doesn't exist"""
        # Setup
        post_id = str(uuid4())
        mock_post_repository.get_by_id.return_value = None

        # Execute & Assert
        with pytest.raises(ValueError, match="Post not found"):
            await post_service.get_post_by_id(post_id)

    @pytest.mark.asyncio
    async def test_update_post_success(
        self,
        post_service: PostService,
        mock_post_repository: AsyncMock,
        sample_post: Post,
        sample_user: User,
    ):
        """Test successful post update"""
        # Setup
        updated_post = Post(**sample_post.model_dump())
        updated_post.content = "更新された内容"

        mock_post_repository.get_by_id.return_value = sample_post
        mock_post_repository.update.return_value = updated_post

        update_data = {"content": "更新された内容"}

        # Execute
        result = await post_service.update_post(sample_post.id, update_data, sample_user.id)

        # Assert
        assert result.content == "更新された内容"
        mock_post_repository.get_by_id.assert_called_once_with(sample_post.id)
        mock_post_repository.update.assert_called_once()

    @pytest.mark.asyncio
    async def test_update_post_unauthorized(
        self, post_service: PostService, mock_post_repository: AsyncMock, sample_post: Post
    ):
        """Test updating post by unauthorized user"""
        # Setup
        unauthorized_user_id = str(uuid4())
        mock_post_repository.get_by_id.return_value = sample_post

        update_data = {"content": "不正な更新"}

        # Execute & Assert
        with pytest.raises(ValueError, match="Not authorized to update this post"):
            await post_service.update_post(sample_post.id, update_data, unauthorized_user_id)

    @pytest.mark.asyncio
    async def test_delete_post_success(
        self,
        post_service: PostService,
        mock_post_repository: AsyncMock,
        sample_post: Post,
        sample_user: User,
    ):
        """Test successful post deletion"""
        # Setup
        mock_post_repository.get_by_id.return_value = sample_post
        mock_post_repository.delete.return_value = None

        # Execute
        await post_service.delete_post(sample_post.id, sample_user.id)

        # Assert
        mock_post_repository.get_by_id.assert_called_once_with(sample_post.id)
        mock_post_repository.delete.assert_called_once_with(sample_post.id)

    @pytest.mark.asyncio
    async def test_delete_post_unauthorized(
        self, post_service: PostService, mock_post_repository: AsyncMock, sample_post: Post
    ):
        """Test deleting post by unauthorized user"""
        # Setup
        unauthorized_user_id = str(uuid4())
        mock_post_repository.get_by_id.return_value = sample_post

        # Execute & Assert
        with pytest.raises(ValueError, match="Not authorized to delete this post"):
            await post_service.delete_post(sample_post.id, unauthorized_user_id)

    @pytest.mark.asyncio
    async def test_get_posts_with_filters(
        self, post_service: PostService, mock_post_repository: AsyncMock
    ):
        """Test getting posts with filters"""
        # Setup
        posts = [
            Post(
                id=str(uuid4()),
                user_id=str(uuid4()),
                content="投稿1",
                author_status=UserStatus.SEEKING,
                author_age_range=AgeRange.TWENTIES,
            ),
            Post(
                id=str(uuid4()),
                user_id=str(uuid4()),
                content="投稿2",
                author_status=UserStatus.SEEKING,
                author_age_range=AgeRange.TWENTIES,
            ),
        ]
        mock_post_repository.get_filtered_posts.return_value = posts

        filters = {
            "status": UserStatus.SEEKING,
            "age_range": AgeRange.TWENTIES,
            "limit": 10,
            "offset": 0,
        }

        # Execute
        result = await post_service.get_posts_with_filters(filters)

        # Assert
        assert result == posts
        mock_post_repository.get_filtered_posts.assert_called_once_with(filters)

    @pytest.mark.asyncio
    async def test_get_replies_for_post(
        self, post_service: PostService, mock_post_repository: AsyncMock, sample_post: Post
    ):
        """Test getting replies for a specific post"""
        # Setup
        replies = [
            Post(
                id=str(uuid4()),
                user_id=str(uuid4()),
                content="返信1",
                parent_id=sample_post.id,
                root_id=sample_post.id,
            ),
            Post(
                id=str(uuid4()),
                user_id=str(uuid4()),
                content="返信2",
                parent_id=sample_post.id,
                root_id=sample_post.id,
            ),
        ]
        mock_post_repository.get_replies.return_value = replies

        # Execute
        result = await post_service.get_replies_for_post(sample_post.id)

        # Assert
        assert result == replies
        mock_post_repository.get_replies.assert_called_once_with(sample_post.id)

    @pytest.mark.asyncio
    async def test_validate_content_profanity(self, post_service: PostService):
        """Test content validation for profanity"""
        # Test clean content
        clean_content = "これは適切な内容です"
        is_valid = await post_service._validate_content(clean_content)
        assert is_valid is True

        # Test inappropriate content (mock profanity detection)
        # In real implementation, this would use banned words service
        # This test would need actual profanity detection implementation
        # For now, we'll assume the method exists and works correctly
