from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel

from api.features.users.schemas import UserResponse


class PostBase(BaseModel):
    content: str


class PostCreate(PostBase):
    pass


class PostUpdate(PostBase):
    pass


class PostResponse(PostBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    # 投稿時点でのユーザー情報スナップショット
    author_status: str
    author_age_range: str

    # いいね関連
    likes_count: int = 0
    is_liked: bool = False  # 認証時のみ設定

    # リプライ関連
    replies_count: int = 0

    user: Optional[UserResponse] = None

    class Config:
        from_attributes = True


class TimelineResponse(BaseModel):
    posts: list[PostResponse]
    next_cursor: Optional[str] = None
