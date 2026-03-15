from datetime import datetime
from uuid import UUID, uuid4

from sqlmodel import Field, SQLModel


class ConversationParticipantBase(SQLModel):
    """会話参加者の基本モデル"""

    conversation_id: UUID = Field(foreign_key="conversations.id")
    user_id: UUID = Field(foreign_key="users.id")
    last_read_at: datetime | None = None


class ConversationParticipant(ConversationParticipantBase, table=True):
    """会話参加者テーブル"""

    __tablename__ = "conversation_participants"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    conversation_id: UUID = Field(foreign_key="conversations.id")
    user_id: UUID = Field(foreign_key="users.id")
    last_read_at: datetime | None = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
