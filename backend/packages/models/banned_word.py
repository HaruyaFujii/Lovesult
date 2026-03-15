from datetime import datetime
from uuid import UUID, uuid4

from sqlmodel import Field, SQLModel


class BannedWordBase(SQLModel):
    word: str = Field(max_length=100, unique=True)
    severity: str = Field(max_length=20, default="medium")  # 'low', 'medium', 'high'
    is_active: bool = Field(default=True)


class BannedWord(BannedWordBase, table=True):
    __tablename__ = "banned_words"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    __table_args__ = {"extend_existing": True}
