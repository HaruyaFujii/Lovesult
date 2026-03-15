from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from packages.services.dm_service import DMService
from packages.services.notification_service import NotificationService

from .schemas import (
    ConversationCreate,
    ConversationDetailResponse,
    ConversationListResponse,
    ConversationResponse,
    MessageCreate,
    MessageListResponse,
    MessageResponse,
)


class DMUseCase:
    def __init__(self, session: AsyncSession):
        self.dm_service = DMService(session)
        self.notification_service = NotificationService(session)

    async def get_conversations(
        self,
        user_id: UUID,
        cursor: str | None = None,
        limit: int = 20,
    ) -> ConversationListResponse:
        """会話一覧を取得"""
        conversations = await self.dm_service.get_user_conversations(
            user_id=user_id,
            cursor=cursor,
            limit=limit,
        )

        conversation_responses = []
        for conv in conversations:
            conversation_responses.append(ConversationResponse(**conv))

        # 次のカーソルは最後の会話のupdated_at
        next_cursor = None
        if len(conversations) == limit and conversations:
            next_cursor = conversations[-1]["updated_at"].isoformat()

        return ConversationListResponse(
            conversations=conversation_responses,
            cursor=next_cursor,
        )

    async def get_or_create_conversation(
        self,
        user_id: UUID,
        data: ConversationCreate,
    ) -> ConversationDetailResponse:
        """会話を取得または作成"""
        # 自分自身との会話は不可
        if user_id == data.partner_id:
            raise ValueError("Cannot create conversation with yourself")

        conversation = await self.dm_service.get_or_create_conversation(
            user_id=user_id,
            partner_id=data.partner_id,
        )
        return ConversationDetailResponse(**conversation)

    async def get_conversation(
        self,
        user_id: UUID,
        conversation_id: UUID,
    ) -> ConversationDetailResponse:
        """会話詳細を取得"""
        conversation = await self.dm_service.get_conversation(
            user_id=user_id,
            conversation_id=conversation_id,
        )
        if not conversation:
            raise PermissionError("Not a participant of this conversation")

        return ConversationDetailResponse(**conversation)

    async def get_messages(
        self,
        user_id: UUID,
        conversation_id: UUID,
        cursor: str | None = None,
        limit: int = 50,
    ) -> MessageListResponse:
        """メッセージ一覧を取得"""
        # 会話の参加者かチェック
        is_participant = await self.dm_service.is_participant(
            conversation_id=conversation_id,
            user_id=user_id,
        )
        if not is_participant:
            raise PermissionError("Not a participant of this conversation")

        messages = await self.dm_service.get_messages(
            conversation_id=conversation_id,
            user_id=user_id,
            cursor=cursor,
            limit=limit,
        )

        message_responses = []
        for msg in messages:
            message_responses.append(MessageResponse(**msg))

        # 次のカーソルは最後のメッセージのcreated_at
        next_cursor = None
        if len(messages) == limit and messages:
            next_cursor = messages[-1]["created_at"].isoformat()

        return MessageListResponse(
            messages=message_responses,
            cursor=next_cursor,
        )

    async def send_message(
        self,
        user_id: UUID,
        conversation_id: UUID,
        data: MessageCreate,
    ) -> MessageResponse:
        """メッセージを送信"""
        # 会話の参加者かチェック
        is_participant = await self.dm_service.is_participant(
            conversation_id=conversation_id,
            user_id=user_id,
        )
        if not is_participant:
            raise PermissionError("Not a participant of this conversation")

        # TODO: 将来的にここで課金チェック
        # if not await self.subscription_service.is_premium(user_id):
        #     raise PaymentRequired("Premium subscription required to send DM")

        message = await self.dm_service.send_message(
            conversation_id=conversation_id,
            sender_id=user_id,
            content=data.content,
        )

        # 相手に通知 (TODO: DM通知機能を実装)
        # partner_id = await self.dm_service.get_partner_id(
        #     conversation_id=conversation_id,
        #     user_id=user_id,
        # )
        # if partner_id:
        #     await self.notification_service.create_dm_notification(
        #         user_id=partner_id,
        #         actor_id=user_id,
        #         conversation_id=conversation_id,
        #     )

        return MessageResponse(**message)

    async def mark_as_read(
        self,
        user_id: UUID,
        conversation_id: UUID,
    ) -> None:
        """既読にする"""
        await self.dm_service.mark_as_read(
            conversation_id=conversation_id,
            user_id=user_id,
        )
