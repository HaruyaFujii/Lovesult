from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel

from api.features.users.schemas import UserResponse
from api.features.posts.schemas import PostResponse


class NotificationResponse(BaseModel):
    id: UUID
    type: str  # 'reply', 'follow', 'like'
    is_read: bool
    created_at: datetime

    # 関連データ
    actor: Optional[UserResponse] = None
    post: Optional[PostResponse] = None
    reply_id: Optional[UUID] = None  # リプライの詳細は必要に応じて

    class Config:
        from_attributes = True


class NotificationListResponse(BaseModel):
    notifications: list[NotificationResponse]
    next_cursor: Optional[str] = None


class UnreadCountResponse(BaseModel):
    unread_count: int