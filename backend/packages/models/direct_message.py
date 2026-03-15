from datetime import datetime
from typing import TYPE_CHECKING, Optional
from uuid import UUID, uuid4

from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from packages.models.user import User


class DirectMessageBase(SQLModel):
    """DM基本モデル"""
    conversation_id: UUID = Field(foreign_key="conversations.id")
    sender_id: UUID = Field(foreign_key="users.id")
    content: str = Field(max_length=1000)


class DirectMessage(DirectMessageBase, table=True):
    """DMテーブル"""
    __tablename__ = "direct_messages"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    conversation_id: UUID = Field(foreign_key="conversations.id", index=True)
    sender_id: UUID = Field(foreign_key="users.id", index=True)
    content: str = Field(max_length=1000)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    sender: Optional["User"] = Relationship()