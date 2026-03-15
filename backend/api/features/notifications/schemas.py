from datetime import datetime
from uuid import UUID

from pydantic import BaseModel

from api.features.posts.schemas import PostResponse
from api.features.users.schemas import UserResponse


class NotificationResponse(BaseModel):
    id: UUID
    type: str  # 'reply', 'follow', 'like'
    is_read: bool
    created_at: datetime

    # 関連データ
    actor: UserResponse | None = None
    post: PostResponse | None = None
    reply_id: UUID | None = None  # リプライの詳細は必要に応じて

    class Config:
        from_attributes = True


class NotificationListResponse(BaseModel):
    notifications: list[NotificationResponse]
    next_cursor: str | None = None


class UnreadCountResponse(BaseModel):
    unread_count: int
