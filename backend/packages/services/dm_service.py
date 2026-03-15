from datetime import datetime
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from packages.models.conversation import Conversation
from packages.models.direct_message import DirectMessage
from packages.repositories.conversation_repository import ConversationRepository
from packages.repositories.message_repository import MessageRepository
from packages.repositories.user_repository import UserRepository


class DMService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.conversation_repo = ConversationRepository(session)
        self.message_repo = MessageRepository(session)
        self.user_repo = UserRepository(session)

    async def get_user_conversations(
        self,
        user_id: UUID,
        cursor: str | None = None,
        limit: int = 20,
    ) -> list[dict]:
        """ユーザーの会話一覧を取得（最新メッセージ・未読数付き）"""
        cursor_datetime = None
        if cursor:
            cursor_datetime = datetime.fromisoformat(cursor)

        # 参加している会話を取得
        conversations, next_cursor = await self.conversation_repo.get_user_conversations(
            user_id=user_id,
            cursor=cursor_datetime,
            limit=limit,
        )

        # 各会話の最新メッセージと未読数を取得
        response = []
        for conv in conversations:
            # 相手のユーザー情報を取得
            partner_id = await self.message_repo.get_partner_id(conv.id, user_id)
            if not partner_id:
                continue

            partner = await self.user_repo.get_by_id(partner_id)
            if not partner:
                continue

            # 最新メッセージを取得
            last_message = await self.message_repo.get_last_message(conv.id)
            last_message_dict = None
            if last_message:
                sender = await self.user_repo.get_by_id(last_message.sender_id)
                last_message_dict = {
                    "id": last_message.id,
                    "sender_id": last_message.sender_id,
                    "sender": {
                        "id": sender.id,
                        "nickname": sender.nickname,
                        "avatar_url": sender.avatar_url,
                    }
                    if sender
                    else None,
                    "content": last_message.content,
                    "created_at": last_message.created_at,
                    "is_mine": last_message.sender_id == user_id,
                }

            # 未読数を取得（ConversationParticipantからlast_read_atを取得）
            # TODO: ConversationParticipantの取得処理を実装
            unread_count = 0  # 一旦0で返す

            response.append(
                {
                    "id": conv.id,
                    "partner": {
                        "id": partner.id,
                        "nickname": partner.nickname,
                        "avatar_url": partner.avatar_url,
                    },
                    "last_message": last_message_dict,
                    "unread_count": unread_count,
                    "updated_at": conv.updated_at,
                }
            )

        return response

    async def get_or_create_conversation(
        self,
        user_id: UUID,
        partner_id: UUID,
    ) -> dict:
        """既存の会話を取得、なければ作成"""
        # 既存の会話を検索
        existing = await self.conversation_repo.find_conversation(user_id, partner_id)
        if existing:
            partner = await self.user_repo.get_by_id(partner_id)
            return {
                "id": existing.id,
                "partner": {
                    "id": partner.id,
                    "nickname": partner.nickname,
                    "avatar_url": partner.avatar_url,
                }
                if partner
                else None,
                "created_at": existing.created_at,
            }

        # 新規作成
        conversation = Conversation()
        conversation = await self.conversation_repo.create(conversation)

        # 参加者を追加
        await self.message_repo.add_participant(conversation.id, user_id)
        await self.message_repo.add_participant(conversation.id, partner_id)

        await self.session.commit()

        partner = await self.user_repo.get_by_id(partner_id)
        return {
            "id": conversation.id,
            "partner": {
                "id": partner.id,
                "nickname": partner.nickname,
                "avatar_url": partner.avatar_url,
            }
            if partner
            else None,
            "created_at": conversation.created_at,
        }

    async def get_conversation(
        self,
        user_id: UUID,
        conversation_id: UUID,
    ) -> dict | None:
        """会話詳細を取得"""
        # 会話の参加者かチェック
        is_participant = await self.message_repo.is_participant(conversation_id, user_id)
        if not is_participant:
            return None

        conversation = await self.conversation_repo.get_by_id(conversation_id)
        if not conversation:
            return None

        partner_id = await self.message_repo.get_partner_id(conversation_id, user_id)
        if not partner_id:
            return None

        partner = await self.user_repo.get_by_id(partner_id)
        return {
            "id": conversation.id,
            "partner": {
                "id": partner.id,
                "nickname": partner.nickname,
                "avatar_url": partner.avatar_url,
            }
            if partner
            else None,
            "created_at": conversation.created_at,
        }

    async def is_participant(
        self,
        conversation_id: UUID,
        user_id: UUID,
    ) -> bool:
        """会話の参加者かどうか"""
        return await self.message_repo.is_participant(conversation_id, user_id)

    async def get_messages(
        self,
        conversation_id: UUID,
        user_id: UUID,
        cursor: str | None = None,
        limit: int = 50,
    ) -> list[dict]:
        """メッセージ一覧を取得"""
        cursor_datetime = None
        if cursor:
            cursor_datetime = datetime.fromisoformat(cursor)

        messages, next_cursor = await self.message_repo.get_messages(
            conversation_id=conversation_id,
            cursor=cursor_datetime,
            limit=limit,
        )

        response = []
        for msg in messages:
            sender = await self.user_repo.get_by_id(msg.sender_id)
            response.append(
                {
                    "id": msg.id,
                    "sender_id": msg.sender_id,
                    "sender": {
                        "id": sender.id,
                        "nickname": sender.nickname,
                        "avatar_url": sender.avatar_url,
                    }
                    if sender
                    else None,
                    "content": msg.content,
                    "created_at": msg.created_at,
                    "is_mine": msg.sender_id == user_id,
                }
            )

        return response

    async def send_message(
        self,
        conversation_id: UUID,
        sender_id: UUID,
        content: str,
    ) -> dict:
        """メッセージを送信"""
        message = DirectMessage(
            conversation_id=conversation_id,
            sender_id=sender_id,
            content=content,
        )
        message = await self.message_repo.create(message)

        # 会話のupdated_atを更新
        conversation = await self.conversation_repo.get_by_id(conversation_id)
        if conversation:
            await self.conversation_repo.update(conversation)

        await self.session.commit()

        sender = await self.user_repo.get_by_id(sender_id)
        return {
            "id": message.id,
            "sender_id": message.sender_id,
            "sender": {
                "id": sender.id,
                "nickname": sender.nickname,
                "avatar_url": sender.avatar_url,
            }
            if sender
            else None,
            "content": message.content,
            "created_at": message.created_at,
            "is_mine": True,
        }

    async def get_partner_id(
        self,
        conversation_id: UUID,
        user_id: UUID,
    ) -> UUID | None:
        """会話相手のIDを取得"""
        return await self.message_repo.get_partner_id(conversation_id, user_id)

    async def mark_as_read(
        self,
        conversation_id: UUID,
        user_id: UUID,
    ) -> None:
        """既読にする"""
        await self.message_repo.mark_as_read(conversation_id, user_id)
        await self.session.commit()
