from datetime import datetime
from typing import TYPE_CHECKING, Optional
from uuid import UUID, uuid4

from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from packages.models.like import Like
    from packages.models.report import Report
    from packages.models.user import User
    # from packages.models.bookmark import Bookmark


class PostBase(SQLModel):
    content: str = Field(max_length=500)


class Post(PostBase, table=True):
    __tablename__ = "posts"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID = Field(foreign_key="users.id", index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Reply-related fields
    parent_id: UUID | None = Field(default=None, foreign_key="posts.id", index=True)
    root_id: UUID | None = Field(default=None, foreign_key="posts.id", index=True)
    replies_count: int = Field(default=0)

    # 投稿時点でのユーザー情報スナップショット（重要な情報のみ）
    author_status: str = Field(description="投稿時のステータス")
    author_age_range: str = Field(description="投稿時の年代")
    author_avatar_url: str | None = Field(
        default=None, max_length=500, description="投稿時のアバターURL"
    )

    # Like count (非正規化)
    likes_count: int = Field(default=0)

    # Relationships
    user: Optional["User"] = Relationship(back_populates="posts")
    likes: list["Like"] = Relationship(back_populates="post")
    reports: list["Report"] = Relationship(
        back_populates="reported_post",
        sa_relationship_kwargs={
            "foreign_keys": "[Report.post_id]",
            "cascade": "all, delete-orphan",
        },
    )

    # Self-referential relationships for replies
    parent: Optional["Post"] = Relationship(
        back_populates="child_replies",
        sa_relationship_kwargs={"remote_side": "[Post.id]", "foreign_keys": "[Post.parent_id]"},
    )
    child_replies: list["Post"] = Relationship(
        back_populates="parent", sa_relationship_kwargs={"foreign_keys": "[Post.parent_id]"}
    )

    # Root post relationship (for thread tracking)
    root_post: Optional["Post"] = Relationship(
        sa_relationship_kwargs={"remote_side": "[Post.id]", "foreign_keys": "[Post.root_id]"}
    )

    # bookmarks: List["Bookmark"] = Relationship(back_populates="post")
