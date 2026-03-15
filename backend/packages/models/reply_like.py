from datetime import datetime
from typing import TYPE_CHECKING, Optional
from uuid import UUID, uuid4

from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from packages.models.post import Post
    from packages.models.user import User


class ReplyLikeBase(SQLModel):
    user_id: UUID = Field(foreign_key="users.id", index=True)
    reply_id: UUID = Field(foreign_key="posts.id", index=True)  # Now references posts table


class ReplyLike(ReplyLikeBase, table=True):
    __tablename__ = "reply_likes"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    user: Optional["User"] = Relationship()
    post: Optional["Post"] = Relationship()  # Changed from reply to post

    __table_args__ = {"extend_existing": True}
