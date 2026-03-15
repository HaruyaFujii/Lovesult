from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class QuestionOption(BaseModel):
    text: str
    scores: dict[str, int]


class Question(BaseModel):
    id: int
    text: str
    options: list[QuestionOption]


class QuestionsResponse(BaseModel):
    questions: list[Question]


class AnswerSubmit(BaseModel):
    answers: list[int] = Field(..., min_length=10, max_length=10)  # 各質問の選択肢インデックス


class PersonalityType(BaseModel):
    key: str
    name: str
    description: str
    emoji: str
    color: str
    compatible_with: list[str]


class PersonalityResultResponse(BaseModel):
    primary_type: PersonalityType
    secondary_type: PersonalityType | None = None
    scores: dict[str, int]
    created_at: datetime


class RecommendedUser(BaseModel):
    id: UUID
    nickname: str
    avatar_url: str | None = None
    personality_type: str
    personality_emoji: str
    compatibility_score: float


class RecommendedUsersResponse(BaseModel):
    users: list[RecommendedUser]
