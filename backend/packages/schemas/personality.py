from typing import Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel

from packages.models.personality import PersonalityType


class QuizAnswer(BaseModel):
    question_id: int
    selected_option: int


class PersonalityQuizRequest(BaseModel):
    answers: List[QuizAnswer]


class PersonalityResult(BaseModel):
    personality_type: PersonalityType
    romantic_score: int
    realist_score: int
    adventurer_score: int
    supporter_score: int
    leader_score: int
    analyst_score: int
    title: str
    description: str
    love_style: str
    ideal_partner: str
    advice: str


class PersonalityResponse(BaseModel):
    id: UUID
    user_id: UUID
    personality_type: PersonalityType
    romantic_score: int
    realist_score: int
    adventurer_score: int
    supporter_score: int
    leader_score: int
    analyst_score: int
    description: Optional[str] = None
    love_style: Optional[str] = None
    ideal_partner: Optional[str] = None
    advice: Optional[str] = None


class QuestionResponse(BaseModel):
    id: int
    question: str
    options: List[Dict[str, str]]