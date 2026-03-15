from datetime import datetime
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from packages.models.notification import Notification
from packages.repositories.notification_repository import NotificationRepository


class NotificationService:
    def __init__(self, session: AsyncSession):
        self.repository = NotificationRepository(session)
        self.session = session

    async def create_follow_notification(
        self, followed_user_id: UUID, follower_id: UUID
    ) -> Notification:
        """フォロー通知を作成"""
        # 自分自身への通知は作成しない
        if followed_user_id == follower_id:
            return None

        return await self.repository.create_notification(
            user_id=followed_user_id, actor_id=follower_id, notification_type="follow"
        )

    async def create_like_notification(
        self, post_id: UUID, post_author_id: UUID, liker_id: UUID
    ) -> Notification:
        """いいね通知を作成"""
        # 自分自身への通知は作成しない
        if post_author_id == liker_id:
            return None

        return await self.repository.create_notification(
            user_id=post_author_id, actor_id=liker_id, notification_type="like", post_id=post_id
        )

    async def create_reply_notification(
        self, post_id: UUID, post_author_id: UUID, reply_id: UUID, replier_id: UUID
    ) -> Notification:
        """リプライ通知を作成"""
        # 自分自身への通知は作成しない
        if post_author_id == replier_id:
            return None

        notification = await self.repository.create_notification(
            user_id=post_author_id,
            actor_id=replier_id,
            notification_type="reply",
            post_id=post_id,
            reply_id=reply_id,
        )
        await self.session.commit()
        return notification

    async def get_notifications(
        self, user_id: UUID, cursor: str | None = None, limit: int = 20
    ) -> tuple[list[Notification], str | None]:
        cursor_datetime = None
        if cursor:
            cursor_datetime = datetime.fromisoformat(cursor)

        return await self.repository.get_notifications(user_id, cursor_datetime, limit)

    async def get_unread_count(self, user_id: UUID) -> int:
        return await self.repository.get_unread_count(user_id)

    async def mark_as_read(self, notification_id: UUID, user_id: UUID) -> bool:
        result = await self.repository.mark_as_read(notification_id, user_id)
        if result:
            await self.session.commit()
        return result

    async def mark_all_as_read(self, user_id: UUID) -> int:
        count = await self.repository.mark_all_as_read(user_id)
        if count > 0:
            await self.session.commit()
        return count
