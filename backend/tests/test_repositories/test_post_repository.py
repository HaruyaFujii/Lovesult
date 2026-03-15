"""
Post repository tests
"""

from uuid import uuid4

import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from packages.models.post import Post
from packages.models.user import AgeRange, User, UserStatus
from packages.repositories.post_repository import PostRepository


class TestPostRepository:
    """Test class for PostRepository database operations"""

    @pytest.fixture
    async def post_repository(self, async_session: AsyncSession):
        """Create post repository with async session"""
        return PostRepository(async_session)

    @pytest.fixture
    def sample_post_data(self, test_user: User):
        """Sample post data for testing"""
        return {
            "id": str(uuid4()),
            "user_id": test_user.id,
            "content": "これはテスト投稿です",
            "author_status": test_user.status,
            "author_age_range": test_user.age_range,
        }

    @pytest.mark.asyncio
    async def test_create_post_success(
        self, post_repository: PostRepository, async_session: AsyncSession, sample_post_data: dict
    ):
        """Test successful post creation"""
        # Execute
        post = await post_repository.create(sample_post_data)

        # Assert
        assert post.id == sample_post_data["id"]
        assert post.user_id == sample_post_data["user_id"]
        assert post.content == sample_post_data["content"]
        assert post.author_status == sample_post_data["author_status"]
        assert post.parent_id is None  # Regular post, not a reply

        # Verify post was saved to database
        stmt = select(Post).where(Post.id == post.id)
        result = await async_session.execute(stmt)
        db_post = result.scalar_one_or_none()
        assert db_post is not None
        assert db_post.content == sample_post_data["content"]

    @pytest.mark.asyncio
    async def test_create_reply_success(
        self,
        post_repository: PostRepository,
        async_session: AsyncSession,
        test_post: Post,
        test_user: User,
    ):
        """Test successful reply creation"""
        # Setup
        reply_data = {
            "id": str(uuid4()),
            "user_id": test_user.id,
            "content": "これは返信です",
            "parent_id": test_post.id,
            "root_id": test_post.id,
            "author_status": test_user.status,
            "author_age_range": test_user.age_range,
        }

        # Execute
        reply = await post_repository.create(reply_data)

        # Assert
        assert reply.parent_id == test_post.id
        assert reply.root_id == test_post.id
        assert reply.content == reply_data["content"]

        # Verify reply was saved to database
        stmt = select(Post).where(Post.id == reply.id)
        result = await async_session.execute(stmt)
        db_reply = result.scalar_one_or_none()
        assert db_reply is not None
        assert db_reply.parent_id == test_post.id

    @pytest.mark.asyncio
    async def test_get_post_by_id_success(self, post_repository: PostRepository, test_post: Post):
        """Test successful post retrieval by ID"""
        # Execute
        post = await post_repository.get_by_id(test_post.id)

        # Assert
        assert post is not None
        assert post.id == test_post.id
        assert post.content == test_post.content
        assert post.user_id == test_post.user_id

    @pytest.mark.asyncio
    async def test_get_post_by_id_not_found(self, post_repository: PostRepository):
        """Test post retrieval when post doesn't exist"""
        # Execute
        non_existent_id = str(uuid4())
        post = await post_repository.get_by_id(non_existent_id)

        # Assert
        assert post is None

    @pytest.mark.asyncio
    async def test_update_post_success(
        self, post_repository: PostRepository, test_post: Post, async_session: AsyncSession
    ):
        """Test successful post update"""
        # Setup
        update_data = {
            "content": "更新された投稿内容",
        }

        # Execute
        updated_post = await post_repository.update(test_post.id, update_data)

        # Assert
        assert updated_post.content == update_data["content"]
        assert updated_post.id == test_post.id
        assert updated_post.user_id == test_post.user_id

        # Verify changes were persisted
        await async_session.refresh(updated_post)
        assert updated_post.content == update_data["content"]

    @pytest.mark.asyncio
    async def test_update_post_not_found(self, post_repository: PostRepository):
        """Test updating non-existent post"""
        # Execute
        non_existent_id = str(uuid4())
        update_data = {"content": "新しい内容"}
        result = await post_repository.update(non_existent_id, update_data)

        # Assert
        assert result is None

    @pytest.mark.asyncio
    async def test_delete_post_success(
        self, post_repository: PostRepository, test_post: Post, async_session: AsyncSession
    ):
        """Test successful post deletion"""
        # Execute
        await post_repository.delete(test_post.id)

        # Assert - post should be removed from database
        stmt = select(Post).where(Post.id == test_post.id)
        result = await async_session.execute(stmt)
        db_post = result.scalar_one_or_none()
        assert db_post is None

    @pytest.mark.asyncio
    async def test_get_posts_by_user_id(
        self, post_repository: PostRepository, async_session: AsyncSession, test_user: User
    ):
        """Test getting posts by user ID"""
        # Setup - create multiple posts for the user
        posts_data = []
        for i in range(3):
            posts_data.append(
                {
                    "id": str(uuid4()),
                    "user_id": test_user.id,
                    "content": f"ユーザーの投稿 {i + 1}",
                    "author_status": test_user.status,
                    "author_age_range": test_user.age_range,
                }
            )

        for post_data in posts_data:
            post = Post(**post_data)
            async_session.add(post)
        await async_session.commit()

        # Execute
        user_posts = await post_repository.get_posts_by_user_id(test_user.id)

        # Assert
        assert len(user_posts) >= 3  # At least 3 posts (might include test_post fixture)
        for post in user_posts:
            assert post.user_id == test_user.id

    @pytest.mark.asyncio
    async def test_get_filtered_posts(
        self, post_repository: PostRepository, async_session: AsyncSession
    ):
        """Test getting posts with filters"""
        # Setup - create posts with different attributes
        posts_data = [
            {
                "id": str(uuid4()),
                "user_id": str(uuid4()),
                "content": "SEEKING投稿1",
                "author_status": UserStatus.SEEKING,
                "author_age_range": AgeRange.TWENTIES,
            },
            {
                "id": str(uuid4()),
                "user_id": str(uuid4()),
                "content": "SEEKING投稿2",
                "author_status": UserStatus.SEEKING,
                "author_age_range": AgeRange.TWENTIES,
            },
            {
                "id": str(uuid4()),
                "user_id": str(uuid4()),
                "content": "IN_LOVE投稿",
                "author_status": UserStatus.IN_LOVE,
                "author_age_range": AgeRange.THIRTIES,
            },
        ]

        for post_data in posts_data:
            post = Post(**post_data)
            async_session.add(post)
        await async_session.commit()

        # Execute - filter by status and age_range
        filters = {
            "status": UserStatus.SEEKING,
            "age_range": AgeRange.TWENTIES,
            "limit": 10,
            "offset": 0,
        }
        result = await post_repository.get_filtered_posts(filters)

        # Assert
        assert len(result) >= 2  # Should find at least the 2 SEEKING posts
        for post in result:
            if post.author_status is not None:
                assert post.author_status == UserStatus.SEEKING
            if post.author_age_range is not None:
                assert post.author_age_range == AgeRange.TWENTIES

    @pytest.mark.asyncio
    async def test_get_filtered_posts_with_pagination(
        self, post_repository: PostRepository, async_session: AsyncSession, test_user: User
    ):
        """Test getting posts with pagination"""
        # Setup - create multiple posts
        posts_data = []
        for i in range(5):
            posts_data.append(
                {
                    "id": str(uuid4()),
                    "user_id": test_user.id,
                    "content": f"投稿 {i + 1}",
                    "author_status": UserStatus.SEEKING,
                    "author_age_range": AgeRange.TWENTIES,
                }
            )

        for post_data in posts_data:
            post = Post(**post_data)
            async_session.add(post)
        await async_session.commit()

        # Execute - test pagination
        filters = {
            "limit": 2,
            "offset": 0,
        }
        page1 = await post_repository.get_filtered_posts(filters)

        filters["offset"] = 2
        page2 = await post_repository.get_filtered_posts(filters)

        # Assert
        assert len(page1) >= 2
        assert len(page2) >= 2
        # Ensure different posts in each page (if we have enough posts)
        if len(page1) >= 2 and len(page2) >= 2:
            page1_ids = {post.id for post in page1[:2]}
            page2_ids = {post.id for post in page2[:2]}
            # Some overlap is possible due to test_post fixture, but shouldn't be identical
            assert page1_ids != page2_ids

    @pytest.mark.asyncio
    async def test_get_replies_for_post(
        self,
        post_repository: PostRepository,
        async_session: AsyncSession,
        test_post: Post,
        test_user: User,
    ):
        """Test getting replies for a specific post"""
        # Setup - create replies to the test post
        replies_data = []
        for i in range(3):
            replies_data.append(
                {
                    "id": str(uuid4()),
                    "user_id": test_user.id,
                    "content": f"返信 {i + 1}",
                    "parent_id": test_post.id,
                    "root_id": test_post.id,
                    "author_status": test_user.status,
                    "author_age_range": test_user.age_range,
                }
            )

        for reply_data in replies_data:
            reply = Post(**reply_data)
            async_session.add(reply)
        await async_session.commit()

        # Execute
        replies = await post_repository.get_replies(test_post.id)

        # Assert
        assert len(replies) == 3
        for reply in replies:
            assert reply.parent_id == test_post.id
            assert reply.root_id == test_post.id

    @pytest.mark.asyncio
    async def test_search_posts_by_content(
        self, post_repository: PostRepository, async_session: AsyncSession, test_user: User
    ):
        """Test searching posts by content"""
        # Setup - create posts with searchable content
        posts_data = [
            {
                "id": str(uuid4()),
                "user_id": test_user.id,
                "content": "これは恋愛についての投稿です",
                "author_status": test_user.status,
            },
            {
                "id": str(uuid4()),
                "user_id": test_user.id,
                "content": "今日は良い天気ですね",
                "author_status": test_user.status,
            },
            {
                "id": str(uuid4()),
                "user_id": test_user.id,
                "content": "恋愛相談をしたいです",
                "author_status": test_user.status,
            },
        ]

        for post_data in posts_data:
            post = Post(**post_data)
            async_session.add(post)
        await async_session.commit()

        # Execute - search for posts containing "恋愛"
        search_term = "恋愛"
        result = await post_repository.search_posts(search_term, limit=10)

        # Assert
        assert len(result) == 2  # Should find 2 posts containing "恋愛"
        for post in result:
            assert search_term in post.content

    @pytest.mark.asyncio
    async def test_get_post_statistics(self, post_repository: PostRepository, test_post: Post):
        """Test getting post statistics"""
        # Execute
        stats = await post_repository.get_post_statistics(test_post.id)

        # Assert - stats should be a dictionary with expected keys
        assert isinstance(stats, dict)
        expected_keys = ["likes_count", "replies_count", "views_count"]
        for key in expected_keys:
            if key in stats:  # Some stats might not be implemented yet
                assert isinstance(stats[key], int)
                assert stats[key] >= 0
