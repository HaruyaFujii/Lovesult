from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel

from api.features.users.schemas import UserResponse


class PostBase(BaseModel):
    content: str


class PostCreate(PostBase):
    parent_id: UUID | None = None  # For creating replies


class PostUpdate(PostBase):
    pass


class PostResponse(PostBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    # Reply-related fields
    parent_id: UUID | None = None
    root_id: UUID | None = None

    # 投稿時点でのユーザー情報スナップショット
    author_status: str
    author_age_range: str

    # いいね関連
    likes_count: int = 0
    is_liked: bool = False  # 認証時のみ設定

    # リプライ関連
    replies_count: int = 0
    has_replies: bool = False

    user: UserResponse | None = None

    class Config:
        from_attributes = True


class RepliesResponse(BaseModel):
    replies: Any


class TimelineResponse(BaseModel):
    posts: Any
    next_cursor: str | None = None
