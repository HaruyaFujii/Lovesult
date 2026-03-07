from datetime import datetime
from typing import List, Optional, Tuple
from uuid import UUID

from sqlmodel import Session

from packages.models.message import Message, MessageType, MessageStatus
from packages.models.conversation import Conversation
from packages.models.user import User
from packages.repositories.message import MessageRepository, ConversationRepository
from packages.repositories.user_repository import UserRepository
from packages.schemas.message import (
    MessageCreate,
    MessageResponse,
    ConversationResponse,
    UserInfo
)


class MessageService:
    def __init__(self, db: Session):
        self.db = db
        self.message_repository = MessageRepository(db)
        self.conversation_repository = ConversationRepository(db)
        self.user_repository = UserRepository(db)

    def send_message(
        self,
        sender_id: UUID,
        message_data: MessageCreate
    ) -> MessageResponse:
        # Get or create conversation
        conversation = self.conversation_repository.get_or_create_conversation(
            sender_id, message_data.recipient_id
        )

        # Create message
        message = Message(
            sender_id=sender_id,
            recipient_id=message_data.recipient_id,
            conversation_id=conversation.id,
            content=message_data.content,
            message_type=message_data.message_type,
            reply_to_id=message_data.reply_to_id
        )

        saved_message = self.message_repository.create_message(message)

        # Update conversation
        self.conversation_repository.update_conversation_last_message(
            conversation.id, saved_message.id
        )
        self.conversation_repository.increment_unread_count(
            conversation.id, message_data.recipient_id
        )

        return self._build_message_response(saved_message)

    def get_conversation_messages(
        self,
        conversation_id: UUID,
        user_id: UUID,
        limit: int = 50,
        offset: int = 0
    ) -> Tuple[List[MessageResponse], int, bool]:
        # Verify user is part of conversation
        if not self._user_in_conversation(conversation_id, user_id):
            raise ValueError("User not authorized to access this conversation")

        messages, total = self.message_repository.get_messages_by_conversation(
            conversation_id, limit, offset
        )

        message_responses = [
            self._build_message_response(msg) for msg in messages
        ]

        has_more = offset + len(messages) < total

        return message_responses, total, has_more

    def get_user_conversations(
        self,
        user_id: UUID,
        limit: int = 20,
        offset: int = 0
    ) -> Tuple[List[ConversationResponse], int]:
        conversations, total = self.conversation_repository.get_user_conversations(
            user_id, limit, offset
        )

        conversation_responses = []
        for conv in conversations:
            response = self._build_conversation_response(conv, user_id)
            conversation_responses.append(response)

        return conversation_responses, total

    def mark_conversation_as_read(
        self,
        conversation_id: UUID,
        user_id: UUID
    ) -> int:
        # Verify user is part of conversation
        if not self._user_in_conversation(conversation_id, user_id):
            raise ValueError("User not authorized to access this conversation")

        # Mark messages as read
        count = self.message_repository.mark_conversation_messages_as_read(
            conversation_id, user_id
        )

        # Reset unread count in conversation
        self.conversation_repository.reset_unread_count(conversation_id, user_id)

        return count

    def get_unread_message_count(self, user_id: UUID) -> int:
        conversations, _ = self.conversation_repository.get_user_conversations(
            user_id, limit=1000, offset=0
        )

        total_unread = 0
        for conv in conversations:
            if conv.user1_id == user_id:
                total_unread += conv.user1_unread_count
            elif conv.user2_id == user_id:
                total_unread += conv.user2_unread_count

        return total_unread

    def _user_in_conversation(self, conversation_id: UUID, user_id: UUID) -> bool:
        statement = """
        SELECT 1 FROM conversations
        WHERE id = :conv_id AND (user1_id = :user_id OR user2_id = :user_id)
        """
        result = self.db.execute(
            statement,
            {"conv_id": conversation_id, "user_id": user_id}
        )
        return result.first() is not None

    def _build_message_response(self, message: Message) -> MessageResponse:
        # Get sender and recipient info
        sender = self.user_repository.get_by_id(message.sender_id)
        recipient = self.user_repository.get_by_id(message.recipient_id)

        return MessageResponse(
            id=message.id,
            sender_id=message.sender_id,
            recipient_id=message.recipient_id,
            conversation_id=message.conversation_id,
            content=message.content,
            message_type=message.message_type,
            status=message.status,
            created_at=message.created_at,
            updated_at=message.updated_at,
            read_at=message.read_at,
            reply_to_id=message.reply_to_id,
            sender=UserInfo(
                id=sender.id,
                nickname=sender.nickname,
                avatar_url=sender.avatar_url
            ) if sender else None,
            recipient=UserInfo(
                id=recipient.id,
                nickname=recipient.nickname,
                avatar_url=recipient.avatar_url
            ) if recipient else None
        )

    def _build_conversation_response(
        self,
        conversation: Conversation,
        current_user_id: UUID
    ) -> ConversationResponse:
        # Determine the other user
        other_user_id = (
            conversation.user2_id
            if conversation.user1_id == current_user_id
            else conversation.user1_id
        )
        other_user = self.user_repository.get_by_id(other_user_id)

        # Get unread count for current user
        unread_count = (
            conversation.user1_unread_count
            if conversation.user1_id == current_user_id
            else conversation.user2_unread_count
        )

        # Get last message if available
        last_message_response = None
        if conversation.last_message_id:
            last_message = self.message_repository.get_message_by_id(
                conversation.last_message_id
            )
            if last_message:
                last_message_response = self._build_message_response(last_message)

        return ConversationResponse(
            id=conversation.id,
            user1_id=conversation.user1_id,
            user2_id=conversation.user2_id,
            last_message=last_message_response,
            unread_count=unread_count,
            created_at=conversation.created_at,
            updated_at=conversation.updated_at,
            other_user=UserInfo(
                id=other_user.id,
                nickname=other_user.nickname,
                avatar_url=other_user.avatar_url
            ) if other_user else None
        )