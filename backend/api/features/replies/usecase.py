from typing import Any, Dict, List, Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from packages.services.reply_service import ReplyService
from .schemas import ReplyCreate, ReplyResponse


class ReplyUseCase:
    def __init__(self, session: AsyncSession):
        self.service = ReplyService(session)

    async def create_reply(
        self, post_id: UUID, user_id: UUID, reply_data: ReplyCreate
    ) -> ReplyResponse:
        reply = await self.service.create_reply(
            post_id, user_id, reply_data.content, reply_data.parent_id
        )

        # ReplyResponseに変換してユーザー情報を含める
        return ReplyResponse(
            id=reply.id,
            post_id=reply.post_id,
            user_id=reply.user_id,
            content=reply.content,
            created_at=reply.created_at,
            user=reply.user,
            parent_id=reply.parent_id,
            likes_count=reply.likes_count or 0,
            replies_count=reply.replies_count or 0,
            is_liked=False,
            has_replies=False,  # 新規作成時はfalse
            replies=[]
        )

    async def get_replies(
        self, post_id: UUID, current_user_id: Optional[UUID] = None
    ) -> List[Dict[str, Any]]:
        return await self.service.get_replies(post_id, current_user_id)

    async def get_nested_replies(
        self, parent_reply_id: UUID, current_user_id: Optional[UUID] = None
    ) -> List[Dict[str, Any]]:
        return await self.service.get_nested_replies(parent_reply_id, current_user_id)

    async def get_reply(
        self, reply_id: UUID, current_user_id: Optional[UUID] = None
    ) -> Optional[ReplyResponse]:
        """単一のリプライを取得"""
        reply = await self.service.get_reply(reply_id, current_user_id)
        if not reply:
            return None

        return ReplyResponse(
            id=reply.id,
            post_id=reply.post_id,
            user_id=reply.user_id,
            content=reply.content,
            created_at=reply.created_at,
            user=reply.user,
            parent_id=reply.parent_id,
            likes_count=reply.likes_count or 0,
            replies_count=reply.replies_count or 0,
            is_liked=reply.is_liked if hasattr(reply, 'is_liked') else False,
            has_replies=reply.has_replies if hasattr(reply, 'has_replies') else False,
            replies=[]
        )

    async def delete_reply(self, reply_id: UUID, user_id: UUID) -> bool:
        deleted = await self.service.delete_reply(reply_id, user_id)
        if not deleted:
            raise ValueError(
                "Reply not found or you don't have permission to delete it"
            )
        return True
