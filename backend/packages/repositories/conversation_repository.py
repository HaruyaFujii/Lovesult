from datetime import datetime
from uuid import UUID

from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from packages.models.conversation import Conversation
from packages.models.conversation_participant import ConversationParticipant


class ConversationRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, conversation_id: UUID) -> Conversation | None:
        result = await self.session.execute(
            select(Conversation).where(Conversation.id == conversation_id)
        )
        return result.scalar_one_or_none()

    async def create(self, conversation: Conversation) -> Conversation:
        self.session.add(conversation)
        await self.session.flush()
        await self.session.refresh(conversation)
        return conversation

    async def update(self, conversation: Conversation) -> Conversation:
        conversation.updated_at = datetime.utcnow()
        self.session.add(conversation)
        await self.session.flush()
        await self.session.refresh(conversation)
        return conversation

    async def find_conversation(self, user_id: UUID, partner_id: UUID) -> Conversation | None:
        """2人の既存会話を検索"""
        # サブクエリを使って、両方のユーザーが参加している会話を検索
        query = (
            select(Conversation)
            .join(
                ConversationParticipant,
                ConversationParticipant.conversation_id == Conversation.id,
            )
            .where(ConversationParticipant.user_id.in_([user_id, partner_id]))
            .group_by(Conversation.id)
            .having(func.count(ConversationParticipant.user_id) == 2)
        )

        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def get_user_conversations(
        self,
        user_id: UUID,
        cursor: datetime | None = None,
        limit: int = 20,
    ) -> tuple[list[Conversation], str | None]:
        """ユーザーの会話一覧を取得"""
        query = (
            select(Conversation)
            .join(
                ConversationParticipant,
                ConversationParticipant.conversation_id == Conversation.id,
            )
            .where(ConversationParticipant.user_id == user_id)
            .order_by(desc(Conversation.updated_at))
        )

        if cursor:
            query = query.where(Conversation.updated_at < cursor)

        query = query.limit(limit + 1)

        result = await self.session.execute(query)
        conversations = list(result.scalars().all())

        next_cursor = None
        if len(conversations) > limit:
            conversations = conversations[:limit]
            next_cursor = conversations[-1].updated_at.isoformat()

        return conversations, next_cursor
