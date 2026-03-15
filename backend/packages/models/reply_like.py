from datetime import datetime
from typing import TYPE_CHECKING, Optional
from uuid import UUID, uuid4

from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from packages.models.user import User
    from packages.models.reply import Reply


class ReplyLikeBase(SQLModel):
    user_id: UUID = Field(foreign_key="users.id", index=True)
    reply_id: UUID = Field(foreign_key="replies.id", index=True)


class ReplyLike(ReplyLikeBase, table=True):
    __tablename__ = "reply_likes"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    user: Optional["User"] = Relationship()
    reply: Optional["Reply"] = Relationship(back_populates="likes")

    __table_args__ = {"extend_existing": True}
