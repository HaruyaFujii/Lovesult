from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from packages.models.post import Post
from packages.services.post_service import PostService
from packages.services.timeline_service import TimelineService

from .schemas import PostCreate, PostUpdate


class PostUseCase:
    def __init__(self, session: AsyncSession):
        self.post_service = PostService(session)
        self.timeline_service = TimelineService(session)

    async def create_post(self, user_id: UUID, post_data: PostCreate) -> Post:
        return await self.post_service.create_post(
            user_id, post_data.content, parent_id=post_data.parent_id
        )

    async def get_post(self, post_id: UUID, current_user_id: UUID | None = None) -> dict:
        post = await self.post_service.get_post(post_id, current_user_id)
        if not post:
            raise ValueError("Post not found")
        return post

    async def update_post(self, post_id: UUID, user_id: UUID, post_data: PostUpdate) -> Post:
        post = await self.post_service.update_post(post_id, user_id, post_data.content)
        if not post:
            raise ValueError("Post not found or you don't have permission to edit it")
        return post

    async def delete_post(self, post_id: UUID, user_id: UUID) -> bool:
        deleted = await self.post_service.delete_post(post_id, user_id)
        if not deleted:
            raise ValueError("Post not found or you don't have permission to delete it")
        return True

    async def get_timeline(
        self,
        current_user_id: UUID | None = None,
        status_filter: str | None = None,
        tab: str | None = None,
        cursor: str | None = None,
        limit: int = 20,
    ) -> tuple[list[dict], str | None]:
        return await self.timeline_service.get_timeline(
            current_user_id=current_user_id,
            status_filter=status_filter,
            tab=tab,
            cursor=cursor,
            limit=limit,
        )

    async def get_replies(self, post_id: UUID, current_user_id: UUID | None = None) -> list[dict]:
        """Get replies for a post"""
        return await self.post_service.get_replies(post_id, current_user_id)
