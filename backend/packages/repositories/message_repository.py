from datetime import datetime
from uuid import UUID

from sqlalchemy import and_, desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from packages.models.conversation_participant import ConversationParticipant
from packages.models.direct_message import DirectMessage


class MessageRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, message: DirectMessage) -> DirectMessage:
        self.session.add(message)
        await self.session.flush()
        await self.session.refresh(message)
        return message

    async def get_messages(
        self,
        conversation_id: UUID,
        cursor: datetime | None = None,
        limit: int = 50,
    ) -> tuple[list[DirectMessage], str | None]:
        """メッセージ一覧を取得"""
        query = (
            select(DirectMessage)
            .where(DirectMessage.conversation_id == conversation_id)
            .options(selectinload(DirectMessage.sender))
            .order_by(desc(DirectMessage.created_at))
        )

        if cursor:
            query = query.where(DirectMessage.created_at < cursor)

        query = query.limit(limit + 1)

        result = await self.session.execute(query)
        messages = list(result.scalars().all())

        next_cursor = None
        if len(messages) > limit:
            messages = messages[:limit]
            next_cursor = messages[-1].created_at.isoformat()

        return messages, next_cursor

    async def get_last_message(self, conversation_id: UUID) -> DirectMessage | None:
        """最新メッセージを取得"""
        query = (
            select(DirectMessage)
            .where(DirectMessage.conversation_id == conversation_id)
            .options(selectinload(DirectMessage.sender))
            .order_by(desc(DirectMessage.created_at))
            .limit(1)
        )
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def get_unread_count(
        self,
        conversation_id: UUID,
        user_id: UUID,
        last_read_at: datetime | None,
    ) -> int:
        """未読数を取得"""
        query = select(func.count(DirectMessage.id)).where(
            and_(
                DirectMessage.conversation_id == conversation_id,
                DirectMessage.sender_id != user_id,  # 自分のメッセージは除外
            )
        )

        if last_read_at:
            query = query.where(DirectMessage.created_at > last_read_at)

        result = await self.session.execute(query)
        return result.scalar() or 0

    async def is_participant(self, conversation_id: UUID, user_id: UUID) -> bool:
        """会話の参加者かどうか"""
        query = select(ConversationParticipant).where(
            and_(
                ConversationParticipant.conversation_id == conversation_id,
                ConversationParticipant.user_id == user_id,
            )
        )
        result = await self.session.execute(query)
        return result.scalar_one_or_none() is not None

    async def add_participant(
        self, conversation_id: UUID, user_id: UUID
    ) -> ConversationParticipant:
        """参加者を追加"""
        participant = ConversationParticipant(
            conversation_id=conversation_id,
            user_id=user_id,
        )
        self.session.add(participant)
        await self.session.flush()
        return participant

    async def get_partner_id(self, conversation_id: UUID, user_id: UUID) -> UUID | None:
        """会話相手のIDを取得"""
        query = select(ConversationParticipant.user_id).where(
            and_(
                ConversationParticipant.conversation_id == conversation_id,
                ConversationParticipant.user_id != user_id,
            )
        )
        result = await self.session.execute(query)
        partner_id = result.scalar_one_or_none()
        return partner_id

    async def mark_as_read(self, conversation_id: UUID, user_id: UUID) -> None:
        """既読にする"""
        query = select(ConversationParticipant).where(
            and_(
                ConversationParticipant.conversation_id == conversation_id,
                ConversationParticipant.user_id == user_id,
            )
        )
        result = await self.session.execute(query)
        participant = result.scalar_one_or_none()

        if participant:
            participant.last_read_at = datetime.utcnow()
            await self.session.flush()
