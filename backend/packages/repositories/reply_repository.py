from typing import List, Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from packages.models.reply import Reply
from packages.models.user import User


class ReplyRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, reply_id: UUID) -> Optional[Reply]:
        result = await self.session.execute(
            select(Reply)
            .where(Reply.id == reply_id)
            .options(selectinload(Reply.user))
        )
        return result.scalar_one_or_none()

    async def get_by_post_id(self, post_id: UUID) -> List[Reply]:
        result = await self.session.execute(
            select(Reply)
            .where(Reply.post_id == post_id)
            .options(selectinload(Reply.user))
            .order_by(Reply.created_at)
        )
        return list(result.scalars().all())

    async def create(self, reply: Reply) -> Reply:
        self.session.add(reply)
        await self.session.flush()
        await self.session.refresh(reply)
        return reply

    async def delete(self, reply_id: UUID) -> bool:
        result = await self.session.execute(
            select(Reply).where(Reply.id == reply_id)
        )
        reply = result.scalar_one_or_none()
        if not reply:
            return False

        await self.session.delete(reply)
        await self.session.flush()
        return True

    async def count_by_post_id(self, post_id: UUID) -> int:
        result = await self.session.execute(
            select(Reply).where(Reply.post_id == post_id)
        )
        return len(result.scalars().all())