from typing import List, Tuple
from uuid import UUID

from sqlmodel import Session

from packages.services.message import MessageService
from packages.schemas.message import (
    MessageCreate,
    MessageResponse,
    ConversationResponse,
    MessageListResponse,
    ConversationListResponse
)


class MessageUseCase:
    def __init__(self, db: Session):
        self.db = db
        self.message_service = MessageService(db)

    def send_message(
        self,
        sender_id: UUID,
        message_data: MessageCreate
    ) -> MessageResponse:
        """Send a new message"""
        return self.message_service.send_message(sender_id, message_data)

    def get_conversations(
        self,
        user_id: UUID,
        limit: int = 20,
        offset: int = 0
    ) -> ConversationListResponse:
        """Get user's conversations list"""
        conversations, total = self.message_service.get_user_conversations(
            user_id, limit, offset
        )

        return ConversationListResponse(
            conversations=conversations,
            total=total
        )

    def get_conversation_messages(
        self,
        conversation_id: UUID,
        user_id: UUID,
        limit: int = 50,
        offset: int = 0
    ) -> MessageListResponse:
        """Get messages in a conversation"""
        messages, total, has_more = self.message_service.get_conversation_messages(
            conversation_id, user_id, limit, offset
        )

        return MessageListResponse(
            messages=messages,
            total=total,
            has_more=has_more
        )

    def mark_conversation_as_read(
        self,
        conversation_id: UUID,
        user_id: UUID
    ) -> dict:
        """Mark all messages in conversation as read"""
        count = self.message_service.mark_conversation_as_read(
            conversation_id, user_id
        )

        return {"marked_as_read": count}

    def get_unread_count(self, user_id: UUID) -> dict:
        """Get total unread message count for user"""
        count = self.message_service.get_unread_message_count(user_id)

        return {"unread_count": count}

    def start_conversation_with_user(
        self,
        current_user_id: UUID,
        target_user_id: UUID
    ) -> ConversationResponse:
        """Start or get existing conversation with another user"""
        # Send a placeholder message to create conversation if it doesn't exist
        # This could be improved by having a separate "start conversation" method
        conversations, _ = self.message_service.get_user_conversations(
            current_user_id, limit=1000, offset=0
        )

        # Check if conversation already exists
        for conv in conversations:
            if (conv.user1_id == target_user_id and conv.user2_id == current_user_id) or \
               (conv.user1_id == current_user_id and conv.user2_id == target_user_id):
                return conv

        # Create a conversation by sending an initial system message
        message_data = MessageCreate(
            recipient_id=target_user_id,
            content="会話を開始しました",
            message_type="text"
        )

        self.message_service.send_message(current_user_id, message_data)

        # Get the new conversation
        conversations, _ = self.message_service.get_user_conversations(
            current_user_id, limit=1, offset=0
        )

        return conversations[0] if conversations else None