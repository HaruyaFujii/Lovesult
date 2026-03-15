from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from packages.models.post import Post

# from packages.models.reply import Reply
from packages.models.reply_like import ReplyLike
from packages.repositories.like_repository import LikeRepository
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
        post_result = await self.session.execute(select(Post).where(Post.id == post_id))
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

    async def like_reply(self, user_id: UUID, reply_id: UUID) -> bool:
        # すでにいいねしているかチェック
        result = await self.session.execute(
            select(ReplyLike).where(ReplyLike.user_id == user_id, ReplyLike.reply_id == reply_id)
        )
        if result.scalar_one_or_none():
            return False

        # いいねを作成
        reply_like = ReplyLike(user_id=user_id, reply_id=reply_id)
        self.session.add(reply_like)

        # カウント更新 (replies are now stored in posts table)
        reply_result = await self.session.execute(select(Post).where(Post.id == reply_id))
        reply = reply_result.scalar_one_or_none()
        if reply:
            reply.likes_count = (reply.likes_count or 0) + 1

        return True

    async def unlike_reply(self, user_id: UUID, reply_id: UUID) -> bool:
        # いいねを削除
        result = await self.session.execute(
            select(ReplyLike).where(ReplyLike.user_id == user_id, ReplyLike.reply_id == reply_id)
        )
        reply_like = result.scalar_one_or_none()
        if not reply_like:
            return False

        await self.session.delete(reply_like)

        # カウント更新 (replies are now stored in posts table)
        reply_result = await self.session.execute(select(Post).where(Post.id == reply_id))
        reply = reply_result.scalar_one_or_none()
        if reply and reply.likes_count > 0:
            reply.likes_count -= 1

        return True

    async def is_reply_liked(self, user_id: UUID, reply_id: UUID) -> bool:
        result = await self.session.execute(
            select(ReplyLike).where(ReplyLike.user_id == user_id, ReplyLike.reply_id == reply_id)
        )
        return result.scalar_one_or_none() is not None
