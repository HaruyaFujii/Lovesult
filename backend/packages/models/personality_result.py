from datetime import datetime
from uuid import UUID, uuid4

from sqlmodel import JSON, Column, Field, SQLModel


class PersonalityResultBase(SQLModel):
    """性格診断結果の基本モデル"""

    user_id: UUID = Field(foreign_key="users.id", unique=True)
    primary_type: str = Field(max_length=20)
    secondary_type: str | None = Field(default=None, max_length=20)
    scores: dict[str, float] = Field(default={}, sa_column=Column(JSON))
    answers: list[int] = Field(default=[], sa_column=Column(JSON))


class PersonalityResult(PersonalityResultBase, table=True):
    """性格診断結果テーブル"""

    __tablename__ = "personality_results"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID = Field(foreign_key="users.id", unique=True, index=True)
    primary_type: str = Field(max_length=20, index=True)
    secondary_type: str | None = Field(default=None, max_length=20)
    scores: dict[str, float] = Field(default={}, sa_column=Column(JSON))
    answers: list[int] = Field(default=[], sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
