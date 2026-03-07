from uuid import UUID
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from api.core.dependencies import get_current_user_id, get_db
from .schemas import NotificationListResponse, UnreadCountResponse
from .usecase import NotificationUseCase

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=NotificationListResponse, operation_id="getNotifications")
async def get_notifications(
    cursor: Optional[str] = Query(None, description="Pagination cursor"),
    limit: int = Query(20, ge=1, le=100, description="Number of results to return"),
    current_user_id: UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    usecase = NotificationUseCase(db)
    notifications, next_cursor = await usecase.get_notifications(
        current_user_id, cursor, limit
    )
    return NotificationListResponse(notifications=notifications, next_cursor=next_cursor)


@router.get("/unread-count", response_model=UnreadCountResponse, operation_id="getUnreadNotificationCount")
async def get_unread_count(
    current_user_id: UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    usecase = NotificationUseCase(db)
    count = await usecase.get_unread_count(current_user_id)
    return UnreadCountResponse(unread_count=count)


@router.put("/{notification_id}/read", operation_id="markNotificationAsRead")
async def mark_notification_as_read(
    notification_id: UUID,
    current_user_id: UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    usecase = NotificationUseCase(db)
    result = await usecase.mark_as_read(notification_id, current_user_id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    return {"message": "Notification marked as read"}


@router.put("/read-all", operation_id="markAllNotificationsAsRead")
async def mark_all_notifications_as_read(
    current_user_id: UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    usecase = NotificationUseCase(db)
    count = await usecase.mark_all_as_read(current_user_id)
    return {"message": f"{count} notifications marked as read"}