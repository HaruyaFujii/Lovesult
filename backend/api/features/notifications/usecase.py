from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from packages.services.notification_service import NotificationService
from .schemas import NotificationResponse


class NotificationUseCase:
    def __init__(self, session: AsyncSession):
        self.notification_service = NotificationService(session)
        self.session = session

    async def get_notifications(
        self,
        user_id: UUID,
        cursor: Optional[str] = None,
        limit: int = 20
    ) -> Tuple[List[NotificationResponse], Optional[str]]:
        notifications, next_cursor = await self.notification_service.get_notifications(
            user_id, cursor, limit
        )

        # NotificationをNotificationResponseに変換
        notification_responses = []
        for notification in notifications:
            notification_responses.append(NotificationResponse.model_validate(notification))

        return notification_responses, next_cursor

    async def get_unread_count(self, user_id: UUID) -> int:
        return await self.notification_service.get_unread_count(user_id)

    async def mark_as_read(self, notification_id: UUID, user_id: UUID) -> bool:
        return await self.notification_service.mark_as_read(notification_id, user_id)

    async def mark_all_as_read(self, user_id: UUID) -> int:
        return await self.notification_service.mark_all_as_read(user_id)