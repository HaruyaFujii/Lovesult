from typing import Dict, List, Tuple, Optional
from uuid import UUID

from sqlmodel import Session

from packages.models.personality import Personality, PersonalityType
from packages.repositories.personality import PersonalityRepository
from packages.data.personality_data import (
    PERSONALITY_QUESTIONS,
    PERSONALITY_DESCRIPTIONS,
    calculate_personality_type
)


class PersonalityService:
    def __init__(self, db: Session):
        self.db = db
        self.personality_repository = PersonalityRepository(db)

    def get_questions(self) -> List[Dict]:
        questions = []
        for question in PERSONALITY_QUESTIONS:
            questions.append({
                "id": question["id"],
                "question": question["question"],
                "options": [
                    {"text": option["text"]}
                    for option in question["options"]
                ]
            })
        return questions

    def calculate_scores(self, answers: List[Tuple[int, int]]) -> Dict[str, int]:
        scores = {
            "romantic": 0,
            "realist": 0,
            "adventurer": 0,
            "supporter": 0,
            "leader": 0,
            "analyst": 0
        }

        for question_id, selected_option in answers:
            question = next(
                (q for q in PERSONALITY_QUESTIONS if q["id"] == question_id),
                None
            )
            if question and 0 <= selected_option < len(question["options"]):
                option_scores = question["options"][selected_option]["scores"]
                for personality_type, score in option_scores.items():
                    scores[personality_type] += score

        return scores

    def save_personality(
        self,
        user_id: UUID,
        personality_type: PersonalityType,
        scores: Dict[str, int],
        normalized_scores: Dict[str, int]
    ) -> Personality:
        personality_data = PERSONALITY_DESCRIPTIONS[personality_type]

        personality = Personality(
            user_id=user_id,
            personality_type=personality_type,
            romantic_score=normalized_scores.get("romantic_score", 0),
            realist_score=normalized_scores.get("realist_score", 0),
            adventurer_score=normalized_scores.get("adventurer_score", 0),
            supporter_score=normalized_scores.get("supporter_score", 0),
            leader_score=normalized_scores.get("leader_score", 0),
            analyst_score=normalized_scores.get("analyst_score", 0),
            description=personality_data["description"],
            love_style=personality_data["love_style"],
            ideal_partner=personality_data["ideal_partner"],
            advice=personality_data["advice"]
        )

        return self.personality_repository.create_or_update(personality)

    def process_quiz(
        self,
        user_id: UUID,
        answers: List[Tuple[int, int]]
    ) -> Tuple[Personality, PersonalityType, Dict[str, str]]:
        scores = self.calculate_scores(answers)
        personality_type, normalized_scores = calculate_personality_type(scores)
        personality_data = PERSONALITY_DESCRIPTIONS[personality_type]

        personality = self.save_personality(
            user_id, personality_type, scores, normalized_scores
        )

        return personality, personality_type, personality_data

    def get_user_personality(self, user_id: UUID) -> Optional[Personality]:
        return self.personality_repository.get_by_user_id(user_id)