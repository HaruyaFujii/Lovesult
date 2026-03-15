from datetime import datetime
from typing import TYPE_CHECKING, Optional, List
from uuid import UUID, uuid4

from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from packages.models.user import User
    from packages.models.report import Report
    from packages.models.reply_like import ReplyLike


class ReplyBase(SQLModel):
    content: str = Field(max_length=300)


class Reply(ReplyBase, table=True):
    __tablename__ = "replies"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    post_id: UUID = Field(foreign_key="posts.id", index=True)
    user_id: UUID = Field(foreign_key="users.id", index=True)
    parent_id: Optional[UUID] = Field(
        default=None, foreign_key="replies.id", index=True
    )
    likes_count: int = Field(default=0)
    replies_count: int = Field(default=0)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    user: Optional["User"] = Relationship()
    reports: List["Report"] = Relationship(
        back_populates="reported_reply",
        sa_relationship_kwargs={
            "foreign_keys": "[Report.reply_id]",
            "cascade": "all, delete-orphan",
        },
    )
    likes: List["ReplyLike"] = Relationship(back_populates="reply")
