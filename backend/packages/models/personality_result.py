from datetime import datetime
from typing import Optional
from uuid import UUID, uuid4

from sqlmodel import Column, Field, JSON, SQLModel


class PersonalityResultBase(SQLModel):
    """性格診断結果の基本モデル"""
    user_id: UUID = Field(foreign_key="users.id", unique=True)
    primary_type: str = Field(max_length=20)
    secondary_type: Optional[str] = Field(default=None, max_length=20)
    scores: dict = Field(default={}, sa_column=Column(JSON))
    answers: list = Field(default=[], sa_column=Column(JSON))


class PersonalityResult(PersonalityResultBase, table=True):
    """性格診断結果テーブル"""
    __tablename__ = "personality_results"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID = Field(foreign_key="users.id", unique=True, index=True)
    primary_type: str = Field(max_length=20, index=True)
    secondary_type: Optional[str] = Field(default=None, max_length=20)
    scores: dict = Field(default={}, sa_column=Column(JSON))
    answers: list = Field(default=[], sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)