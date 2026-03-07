from typing import Optional
from uuid import UUID

from sqlmodel import Session, select

from packages.models.personality import Personality


class PersonalityRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_user_id(self, user_id: UUID) -> Optional[Personality]:
        statement = select(Personality).where(Personality.user_id == user_id)
        return self.db.exec(statement).first()

    def create_or_update(self, personality: Personality) -> Personality:
        existing = self.get_by_user_id(personality.user_id)

        if existing:
            existing.personality_type = personality.personality_type
            existing.romantic_score = personality.romantic_score
            existing.realist_score = personality.realist_score
            existing.adventurer_score = personality.adventurer_score
            existing.supporter_score = personality.supporter_score
            existing.leader_score = personality.leader_score
            existing.analyst_score = personality.analyst_score
            existing.description = personality.description
            existing.love_style = personality.love_style
            existing.ideal_partner = personality.ideal_partner
            existing.advice = personality.advice

            self.db.add(existing)
            self.db.commit()
            self.db.refresh(existing)
            return existing
        else:
            self.db.add(personality)
            self.db.commit()
            self.db.refresh(personality)
            return personality

    def delete(self, user_id: UUID) -> bool:
        statement = select(Personality).where(Personality.user_id == user_id)
        personality = self.db.exec(statement).first()

        if personality:
            self.db.delete(personality)
            self.db.commit()
            return True
        return False