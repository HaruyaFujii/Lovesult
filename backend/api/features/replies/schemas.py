from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel

from api.features.users.schemas import UserResponse


class ReplyBase(BaseModel):
    content: str


class ReplyCreate(ReplyBase):
    parent_id: Optional[UUID] = None


class ReplyResponse(ReplyBase):
    id: UUID
    post_id: UUID
    user_id: UUID
    created_at: datetime
    user: Optional[UserResponse] = None
    parent_id: Optional[UUID] = None
    likes_count: int = 0
    replies_count: int = 0
    is_liked: bool = False
    has_replies: bool = False  # ネストされたリプライがあるかどうか
    replies: List["ReplyResponse"] = []

    class Config:
        from_attributes = True


class RepliesResponse(BaseModel):
    replies: list[ReplyResponse]
