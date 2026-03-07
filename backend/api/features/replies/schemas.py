from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel

from api.features.users.schemas import UserResponse


class ReplyBase(BaseModel):
    content: str


class ReplyCreate(ReplyBase):
    pass


class ReplyResponse(ReplyBase):
    id: UUID
    post_id: UUID
    user_id: UUID
    created_at: datetime
    user: Optional[UserResponse] = None

    class Config:
        from_attributes = True


class RepliesResponse(BaseModel):
    replies: list[ReplyResponse]