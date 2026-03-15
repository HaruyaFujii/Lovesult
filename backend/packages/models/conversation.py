from datetime import datetime
from uuid import UUID, uuid4

from sqlmodel import Field, SQLModel


class ConversationBase(SQLModel):
    """会話の基本モデル"""

    pass


class Conversation(ConversationBase, table=True):
    """会話テーブル"""

    __tablename__ = "conversations"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
