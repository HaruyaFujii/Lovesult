from datetime import datetime
from typing import Dict, List, Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from packages.models.personality_result import PersonalityResult
from packages.models.user import User
from packages.repositories.personality_repository import PersonalityRepository
from packages.repositories.user_repository import UserRepository


class PersonalityService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.personality_repo = PersonalityRepository(session)
        self.user_repo = UserRepository(session)

    async def get_result(self, user_id: UUID) -> Optional[PersonalityResult]:
        """ユーザーの診断結果を取得"""
        return await self.personality_repo.get_by_user_id(user_id)

    async def save_result(
        self,
        user_id: UUID,
        primary_type: str,
        secondary_type: Optional[str],
        scores: Dict[str, int],
        answers: List[int],
    ) -> PersonalityResult:
        """診断結果を保存"""
        # 既存の結果があるか確認
        existing = await self.personality_repo.get_by_user_id(user_id)

        if existing:
            # 更新
            existing.primary_type = primary_type
            existing.secondary_type = secondary_type
            existing.scores = scores
            existing.answers = answers
            existing.updated_at = datetime.utcnow()
            result = await self.personality_repo.update(existing)
        else:
            # 新規作成
            result = PersonalityResult(
                user_id=user_id,
                primary_type=primary_type,
                secondary_type=secondary_type,
                scores=scores,
                answers=answers,
            )
            result = await self.personality_repo.create(result)

        # ユーザーのpersonality_typeも更新
        user = await self.user_repo.get_by_id(user_id)
        if user:
            user.personality_type = primary_type
            await self.user_repo.update(user)

        await self.session.commit()
        return result