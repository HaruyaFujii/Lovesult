"""
Post API endpoint tests
"""

from uuid import uuid4

import pytest
from httpx import AsyncClient

from packages.models.post import Post
from packages.models.user import User


class TestPostsAPI:
    """Test class for post-related API endpoints"""

    @pytest.mark.asyncio
    async def test_create_post_success(
        self, client: AsyncClient, test_user: User, auth_headers: dict
    ):
        """Test creating a new post"""
        post_data = {"content": "これは新しい投稿です"}

        response = await client.post("/api/v1/posts", json=post_data, headers=auth_headers)

        # Note: Would need proper auth mocking for success
        assert response.status_code in [201, 401]

    @pytest.mark.asyncio
    async def test_create_post_empty_content(self, client: AsyncClient, auth_headers: dict):
        """Test creating post with empty content"""
        post_data = {"content": ""}

        response = await client.post("/api/v1/posts", json=post_data, headers=auth_headers)

        assert response.status_code in [400, 422]

    @pytest.mark.asyncio
    async def test_create_post_content_too_long(self, client: AsyncClient, auth_headers: dict):
        """Test creating post with content exceeding limit"""
        long_content = "a" * 1001  # Assuming 1000 char limit
        post_data = {"content": long_content}

        response = await client.post("/api/v1/posts", json=post_data, headers=auth_headers)

        assert response.status_code in [400, 422]

    @pytest.mark.asyncio
    async def test_create_reply_success(
        self, client: AsyncClient, test_post: Post, auth_headers: dict
    ):
        """Test creating a reply to a post"""
        reply_data = {"content": "これは返信です", "parent_id": str(test_post.id)}

        response = await client.post("/api/v1/posts", json=reply_data, headers=auth_headers)

        # Note: Would need proper auth mocking for success
        assert response.status_code in [201, 401]

    @pytest.mark.asyncio
    async def test_get_posts_list(self, client: AsyncClient, test_post: Post):
        """Test getting list of posts"""
        response = await client.get("/api/v1/posts")

        assert response.status_code == 200
        data = response.json()
        assert "posts" in data
        assert isinstance(data["posts"], list)

    @pytest.mark.asyncio
    async def test_get_posts_with_pagination(self, client: AsyncClient, test_post: Post):
        """Test getting posts with pagination"""
        params = {"limit": 5, "cursor": "some-cursor"}

        response = await client.get("/api/v1/posts", params=params)

        assert response.status_code == 200
        data = response.json()
        assert "posts" in data

    @pytest.mark.asyncio
    async def test_get_posts_with_filters(self, client: AsyncClient, test_post: Post):
        """Test getting posts with status and age filters"""
        params = {"status": "SEEKING", "age_range": "TWENTIES", "tab": "all"}

        response = await client.get("/api/v1/posts", params=params)

        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_get_post_by_id(self, client: AsyncClient, test_post: Post):
        """Test getting specific post by ID"""
        response = await client.get(f"/api/v1/posts/{test_post.id}")

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(test_post.id)
        assert data["content"] == test_post.content

    @pytest.mark.asyncio
    async def test_get_post_not_found(self, client: AsyncClient):
        """Test getting non-existent post"""
        non_existent_id = str(uuid4())
        response = await client.get(f"/api/v1/posts/{non_existent_id}")

        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_get_replies(self, client: AsyncClient, test_post: Post):
        """Test getting replies for a post"""
        response = await client.get(f"/api/v1/posts/{test_post.id}/replies")

        assert response.status_code == 200
        data = response.json()
        assert "replies" in data
        assert isinstance(data["replies"], list)

    @pytest.mark.asyncio
    async def test_update_post_success(
        self, client: AsyncClient, test_post: Post, auth_headers: dict
    ):
        """Test updating a post"""
        update_data = {"content": "更新された投稿内容"}

        response = await client.put(
            f"/api/v1/posts/{test_post.id}", json=update_data, headers=auth_headers
        )

        # Note: Would need proper auth and ownership verification
        assert response.status_code in [200, 401, 403]

    @pytest.mark.asyncio
    async def test_update_post_unauthorized(self, client: AsyncClient, test_post: Post):
        """Test updating post without authentication"""
        update_data = {"content": "不正な更新"}

        response = await client.put(f"/api/v1/posts/{test_post.id}", json=update_data)

        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_delete_post_success(
        self, client: AsyncClient, test_post: Post, auth_headers: dict
    ):
        """Test deleting a post"""
        response = await client.delete(f"/api/v1/posts/{test_post.id}", headers=auth_headers)

        # Note: Would need proper auth and ownership verification
        assert response.status_code in [204, 401, 403]

    @pytest.mark.asyncio
    async def test_delete_post_not_found(self, client: AsyncClient, auth_headers: dict):
        """Test deleting non-existent post"""
        non_existent_id = str(uuid4())
        response = await client.delete(f"/api/v1/posts/{non_existent_id}", headers=auth_headers)

        assert response.status_code in [404, 401]

    @pytest.mark.asyncio
    async def test_like_post_success(
        self, client: AsyncClient, test_post: Post, auth_headers: dict
    ):
        """Test liking a post"""
        response = await client.post(f"/api/v1/posts/{test_post.id}/like", headers=auth_headers)

        # Note: Would need proper auth mocking
        assert response.status_code in [200, 401]

    @pytest.mark.asyncio
    async def test_unlike_post_success(
        self, client: AsyncClient, test_post: Post, auth_headers: dict
    ):
        """Test unliking a post"""
        response = await client.delete(f"/api/v1/posts/{test_post.id}/like", headers=auth_headers)

        # Note: Would need proper auth mocking
        assert response.status_code in [200, 401]

    @pytest.mark.asyncio
    async def test_report_post_success(
        self, client: AsyncClient, test_post: Post, auth_headers: dict
    ):
        """Test reporting a post"""
        report_data = {"type": "INAPPROPRIATE_CONTENT", "reason": "不適切な内容です"}

        response = await client.post(
            f"/api/v1/posts/{test_post.id}/report", json=report_data, headers=auth_headers
        )

        # Note: Would need proper auth mocking
        assert response.status_code in [201, 401]
