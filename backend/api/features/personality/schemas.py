from datetime import datetime
from typing import Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class QuestionOption(BaseModel):
    text: str
    scores: Dict[str, int]


class Question(BaseModel):
    id: int
    text: str
    options: List[QuestionOption]


class QuestionsResponse(BaseModel):
    questions: List[Question]


class AnswerSubmit(BaseModel):
    answers: List[int] = Field(..., min_length=10, max_length=10)  # 各質問の選択肢インデックス


class PersonalityType(BaseModel):
    key: str
    name: str
    description: str
    emoji: str
    color: str
    compatible_with: List[str]


class PersonalityResultResponse(BaseModel):
    primary_type: PersonalityType
    secondary_type: Optional[PersonalityType] = None
    scores: Dict[str, int]
    created_at: datetime


class RecommendedUser(BaseModel):
    id: UUID
    nickname: str
    avatar_url: Optional[str] = None
    personality_type: str
    personality_emoji: str
    compatibility_score: float


class RecommendedUsersResponse(BaseModel):
    users: List[RecommendedUser]