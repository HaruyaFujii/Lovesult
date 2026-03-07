from datetime import datetime
from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy import select, func, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from packages.models.notification import Notification
from packages.models.user import User
from packages.models.post import Post
from packages.models.reply import Reply


class NotificationRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create_notification(
        self,
        user_id: UUID,
        actor_id: UUID,
        notification_type: str,
        post_id: Optional[UUID] = None,
        reply_id: Optional[UUID] = None
    ) -> Notification:
        notification = Notification(
            user_id=user_id,
            actor_id=actor_id,
            type=notification_type,
            post_id=post_id,
            reply_id=reply_id
        )
        self.session.add(notification)
        await self.session.flush()
        return notification

    async def get_notifications(
        self,
        user_id: UUID,
        cursor: Optional[datetime] = None,
        limit: int = 20
    ) -> Tuple[List[Notification], Optional[str]]:
        query = (
            select(Notification)
            .where(Notification.user_id == user_id)
            .options(
                selectinload(Notification.actor),
                selectinload(Notification.post).selectinload(Post.user),
                selectinload(Notification.reply).selectinload(Reply.user)
            )
            .order_by(Notification.created_at.desc())
        )

        if cursor:
            query = query.where(Notification.created_at < cursor)

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
            select(func.count(Notification.id))
            .where(
                Notification.user_id == user_id,
                Notification.is_read == False
            )
        )
        return result.scalar()

    async def mark_as_read(self, notification_id: UUID, user_id: UUID) -> bool:
        result = await self.session.execute(
            update(Notification)
            .where(
                Notification.id == notification_id,
                Notification.user_id == user_id
            )
            .values(is_read=True)
        )
        return result.rowcount > 0

    async def mark_all_as_read(self, user_id: UUID) -> int:
        result = await self.session.execute(
            update(Notification)
            .where(
                Notification.user_id == user_id,
                Notification.is_read == False
            )
            .values(is_read=True)
        )
        return result.rowcount