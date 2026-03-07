from datetime import datetime
from typing import TYPE_CHECKING, List, Optional
from uuid import UUID, uuid4

from sqlmodel import Field, Relationship, SQLModel
from sqlalchemy import Column

if TYPE_CHECKING:
    from packages.models.user import User
    from packages.models.user import UserStatus, Gender, AgeRange
    from packages.models.like import Like
    from packages.models.report import Report
    from packages.models.bookmark import Bookmark


class PostBase(SQLModel):
    content: str = Field(max_length=500)


class Post(PostBase, table=True):
    __tablename__ = "posts"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID = Field(foreign_key="users.id", index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # 投稿時点でのユーザー情報スナップショット（重要な情報のみ）
    author_status: str = Field(description="投稿時のステータス")
    author_age_range: str = Field(description="投稿時の年代")
    author_avatar_url: Optional[str] = Field(default=None, max_length=500, description="投稿時のアバターURL")

    # Like count (非正規化)
    likes_count: int = Field(default=0)


    # Relationships
    user: Optional["User"] = Relationship(back_populates="posts")
    likes: List["Like"] = Relationship(back_populates="post")
    reports: List["Report"] = Relationship(
        back_populates="reported_post",
        sa_relationship_kwargs={
            "foreign_keys": "[Report.post_id]",
            "cascade": "all, delete-orphan"
        }
    )
    bookmarks: List["Bookmark"] = Relationship(back_populates="post")