from uuid import UUID

from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from packages.models.personality_result import PersonalityResult
from packages.models.user import User


class PersonalityRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_user_id(self, user_id: UUID) -> PersonalityResult | None:
        result = await self.session.execute(
            select(PersonalityResult).where(PersonalityResult.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def create(self, personality_result: PersonalityResult) -> PersonalityResult:
        self.session.add(personality_result)
        await self.session.flush()
        await self.session.refresh(personality_result)
        return personality_result

    async def update(self, personality_result: PersonalityResult) -> PersonalityResult:
        self.session.add(personality_result)
        await self.session.flush()
        await self.session.refresh(personality_result)
        return personality_result

    async def get_users_by_personality_type(
        self,
        personality_types: list[str],
        exclude_user_id: UUID,
        limit: int = 10,
    ) -> list[User]:
        """特定の性格タイプのユーザーを取得"""
        result = await self.session.execute(
            select(User)
            .join(PersonalityResult, User.id == PersonalityResult.user_id)
            .where(
                and_(
                    PersonalityResult.personality_type.in_(personality_types),
                    User.id != exclude_user_id
                )
            )
            .limit(limit)
        )
        return list(result.scalars().all())
