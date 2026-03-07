from typing import List
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from packages.models.reply import Reply
from packages.services.reply_service import ReplyService
from .schemas import ReplyCreate


class ReplyUseCase:
    def __init__(self, session: AsyncSession):
        self.service = ReplyService(session)

    async def create_reply(
        self, post_id: UUID, user_id: UUID, reply_data: ReplyCreate
    ) -> Reply:
        return await self.service.create_reply(post_id, user_id, reply_data.content)

    async def get_replies(self, post_id: UUID) -> List[Reply]:
        return await self.service.get_replies(post_id)

    async def delete_reply(self, reply_id: UUID, user_id: UUID) -> bool:
        deleted = await self.service.delete_reply(reply_id, user_id)
        if not deleted:
            raise ValueError("Reply not found or you don't have permission to delete it")
        return True