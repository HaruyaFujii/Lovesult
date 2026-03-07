from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from packages.repositories.like_repository import LikeRepository
from packages.models.post import Post
from packages.services.notification_service import NotificationService


class LikeService:
    def __init__(self, session: AsyncSession):
        self.repository = LikeRepository(session)
        self.session = session

    async def like_post(self, user_id: UUID, post_id: UUID) -> bool:
        # すでにいいねしているかチェック
        is_already_liked = await self.repository.is_liked(user_id, post_id)
        if is_already_liked:
            return False

        # いいねを作成
        await self.repository.create_like(user_id, post_id)

        # カウント更新
        await self.repository.increment_like_count(post_id)

        # 投稿の作者を取得して通知を作成
        post_result = await self.session.execute(
            select(Post).where(Post.id == post_id)
        )
        post = post_result.scalar_one()

        notification_service = NotificationService(self.session)
        await notification_service.create_like_notification(post_id, post.user_id, user_id)

        return True

    async def unlike_post(self, user_id: UUID, post_id: UUID) -> bool:
        # いいねを削除
        is_deleted = await self.repository.delete_like(user_id, post_id)

        if is_deleted:
            # カウント更新
            await self.repository.decrement_like_count(post_id)

        return is_deleted

    async def is_liked(self, user_id: UUID, post_id: UUID) -> bool:
        return await self.repository.is_liked(user_id, post_id)