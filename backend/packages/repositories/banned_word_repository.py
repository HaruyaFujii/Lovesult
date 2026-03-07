from typing import List

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from packages.models.banned_word import BannedWord


class BannedWordRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_active_banned_words(self) -> List[BannedWord]:
        result = await self.session.execute(
            select(BannedWord).where(BannedWord.is_active == True)
        )
        return list(result.scalars().all())