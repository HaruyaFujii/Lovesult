from typing import List, Dict, Any, Optional, Tuple
from uuid import UUID

from sqlmodel import Session

from packages.services.personality import PersonalityService
from packages.schemas.personality import (
    PersonalityQuizRequest,
    PersonalityResult,
    PersonalityResponse,
    QuestionResponse
)
from packages.models.personality import PersonalityType


class PersonalityUseCase:
    def __init__(self, db: Session):
        self.db = db
        self.personality_service = PersonalityService(db)

    def get_quiz_questions(self) -> List[QuestionResponse]:
        questions = self.personality_service.get_questions()
        return [QuestionResponse(**question) for question in questions]

    def submit_quiz(
        self,
        user_id: UUID,
        quiz_request: PersonalityQuizRequest
    ) -> PersonalityResult:
        answers = [(answer.question_id, answer.selected_option)
                  for answer in quiz_request.answers]

        personality, personality_type, personality_data = (
            self.personality_service.process_quiz(user_id, answers)
        )

        return PersonalityResult(
            personality_type=personality_type,
            romantic_score=personality.romantic_score,
            realist_score=personality.realist_score,
            adventurer_score=personality.adventurer_score,
            supporter_score=personality.supporter_score,
            leader_score=personality.leader_score,
            analyst_score=personality.analyst_score,
            title=personality_data["title"],
            description=personality_data["description"],
            love_style=personality_data["love_style"],
            ideal_partner=personality_data["ideal_partner"],
            advice=personality_data["advice"]
        )

    def get_user_personality(self, user_id: UUID) -> Optional[PersonalityResponse]:
        personality = self.personality_service.get_user_personality(user_id)

        if not personality:
            return None

        return PersonalityResponse(
            id=personality.id,
            user_id=personality.user_id,
            personality_type=personality.personality_type,
            romantic_score=personality.romantic_score,
            realist_score=personality.realist_score,
            adventurer_score=personality.adventurer_score,
            supporter_score=personality.supporter_score,
            leader_score=personality.leader_score,
            analyst_score=personality.analyst_score,
            description=personality.description,
            love_style=personality.love_style,
            ideal_partner=personality.ideal_partner,
            advice=personality.advice
        )