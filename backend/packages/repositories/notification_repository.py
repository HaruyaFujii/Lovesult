from datetime import datetime
from uuid import UUID

from sqlalchemy import and_, desc, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from packages.models.notification import Notification
from packages.models.post import Post

# from packages.models.reply import Reply  # Replies are now stored in posts table


class NotificationRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create_notification(
        self,
        user_id: UUID,
        actor_id: UUID,
        notification_type: str,
        post_id: UUID | None = None,
        reply_id: UUID | None = None,
        title: str | None = None,
        message: str | None = None,
    ) -> Notification:
        # デフォルトのタイトルとメッセージを設定
        if not title:
            if notification_type == "follow":
                title = "新しいフォロワー"
            elif notification_type == "like":
                title = "投稿にいいね"
            elif notification_type == "reply":
                title = "投稿への返信"
            else:
                title = "通知"

        if not message:
            if notification_type == "follow":
                message = "あなたをフォローしました"
            elif notification_type == "like":
                message = "投稿にいいねしました"
            elif notification_type == "reply":
                message = "投稿に返信しました"
            else:
                message = ""

        notification = Notification(
            user_id=user_id,
            actor_id=actor_id,
            type=notification_type,
            title=title,
            message=message,
            post_id=post_id,
            reply_id=reply_id,
        )
        self.session.add(notification)
        await self.session.flush()
        return notification

    async def get_notifications(
        self, user_id: UUID, cursor: datetime | None = None, limit: int = 20
    ) -> tuple[list[Notification], str | None]:
        query = (
            select(Notification)
            .options(
                selectinload(Notification.post).selectinload(Post.user),
                selectinload(Notification.reply).selectinload(Post.user)
            )  # reply now refers to Post with parent_id
            .where(Notification.user_id == user_id)
            .order_by(desc(Notification.created_at))
        )

        if cursor:
            cursor_time = datetime.fromisoformat(cursor)
            query = query.where(Notification.created_at < cursor_time)

        query = query.limit(limit + 1)
        result = await self.session.execute(query)
        notifications = list(result.scalars().all())

        next_cursor = None
        if len(notifications) > limit:
            notifications = notifications[:limit]
            if notifications:
                next_cursor = notifications[-1].created_at.isoformat()

        return notifications, next_cursor

    async def get_unread_count(self, user_id: UUID) -> int:
        result = await self.session.execute(
            select(func.count(Notification.id)).where(
                and_(Notification.user_id == user_id, Notification.is_read == False)
            )
        )
        return result.scalar()

    async def mark_as_read(self, notification_id: UUID, user_id: UUID) -> bool:
        result = await self.session.execute(
            update(Notification)
            .where(and_(Notification.id == notification_id, Notification.user_id == user_id))
            .values(is_read=True)
        )
        return result.rowcount > 0

    async def mark_all_as_read(self, user_id: UUID) -> int:
        result = await self.session.execute(
            update(Notification)
            .where(Notification.user_id == user_id)
            .values(is_read=True)
        )
        return result.rowcount
