from datetime import datetime
from typing import List, Optional, Tuple
from uuid import UUID

from sqlmodel import Session, select, and_, or_, func

from packages.models.message import Message
from packages.models.conversation import Conversation
from packages.models.user import User


class MessageRepository:
    def __init__(self, db: Session):
        self.db = db

    def create_message(self, message: Message) -> Message:
        self.db.add(message)
        self.db.commit()
        self.db.refresh(message)
        return message

    def get_message_by_id(self, message_id: UUID) -> Optional[Message]:
        statement = select(Message).where(Message.id == message_id)
        return self.db.exec(statement).first()

    def get_messages_by_conversation(
        self,
        conversation_id: UUID,
        limit: int = 50,
        offset: int = 0
    ) -> Tuple[List[Message], int]:
        # Get messages with sender/recipient info
        statement = (
            select(Message)
            .where(Message.conversation_id == conversation_id)
            .order_by(Message.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        messages = self.db.exec(statement).all()

        # Get total count
        count_statement = (
            select(func.count(Message.id))
            .where(Message.conversation_id == conversation_id)
        )
        total = self.db.exec(count_statement).one()

        return list(messages), total

    def mark_message_as_read(self, message_id: UUID, user_id: UUID) -> bool:
        statement = (
            select(Message)
            .where(
                and_(
                    Message.id == message_id,
                    Message.recipient_id == user_id
                )
            )
        )
        message = self.db.exec(statement).first()

        if message:
            message.status = "read"
            message.read_at = datetime.utcnow()
            self.db.add(message)
            self.db.commit()
            return True
        return False

    def mark_conversation_messages_as_read(
        self,
        conversation_id: UUID,
        user_id: UUID
    ) -> int:
        statement = (
            select(Message)
            .where(
                and_(
                    Message.conversation_id == conversation_id,
                    Message.recipient_id == user_id,
                    Message.status != "read"
                )
            )
        )
        messages = self.db.exec(statement).all()

        count = 0
        for message in messages:
            message.status = "read"
            message.read_at = datetime.utcnow()
            self.db.add(message)
            count += 1

        self.db.commit()
        return count


class ConversationRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_or_create_conversation(
        self,
        user1_id: UUID,
        user2_id: UUID
    ) -> Conversation:
        # Ensure consistent ordering
        if user1_id > user2_id:
            user1_id, user2_id = user2_id, user1_id

        # Try to find existing conversation
        statement = (
            select(Conversation)
            .where(
                and_(
                    Conversation.user1_id == user1_id,
                    Conversation.user2_id == user2_id
                )
            )
        )
        conversation = self.db.exec(statement).first()

        if not conversation:
            # Create new conversation
            conversation = Conversation(
                user1_id=user1_id,
                user2_id=user2_id
            )
            self.db.add(conversation)
            self.db.commit()
            self.db.refresh(conversation)

        return conversation

    def get_user_conversations(
        self,
        user_id: UUID,
        limit: int = 20,
        offset: int = 0
    ) -> Tuple[List[Conversation], int]:
        statement = (
            select(Conversation)
            .where(
                or_(
                    Conversation.user1_id == user_id,
                    Conversation.user2_id == user_id
                )
            )
            .order_by(Conversation.updated_at.desc())
            .offset(offset)
            .limit(limit)
        )
        conversations = self.db.exec(statement).all()

        # Get total count
        count_statement = (
            select(func.count(Conversation.id))
            .where(
                or_(
                    Conversation.user1_id == user_id,
                    Conversation.user2_id == user_id
                )
            )
        )
        total = self.db.exec(count_statement).one()

        return list(conversations), total

    def update_conversation_last_message(
        self,
        conversation_id: UUID,
        message_id: UUID
    ) -> None:
        statement = select(Conversation).where(Conversation.id == conversation_id)
        conversation = self.db.exec(statement).first()

        if conversation:
            conversation.last_message_id = message_id
            conversation.updated_at = datetime.utcnow()
            self.db.add(conversation)
            self.db.commit()

    def increment_unread_count(
        self,
        conversation_id: UUID,
        recipient_id: UUID
    ) -> None:
        statement = select(Conversation).where(Conversation.id == conversation_id)
        conversation = self.db.exec(statement).first()

        if conversation:
            if conversation.user1_id == recipient_id:
                conversation.user1_unread_count += 1
            elif conversation.user2_id == recipient_id:
                conversation.user2_unread_count += 1

            self.db.add(conversation)
            self.db.commit()

    def reset_unread_count(
        self,
        conversation_id: UUID,
        user_id: UUID
    ) -> None:
        statement = select(Conversation).where(Conversation.id == conversation_id)
        conversation = self.db.exec(statement).first()

        if conversation:
            if conversation.user1_id == user_id:
                conversation.user1_unread_count = 0
            elif conversation.user2_id == user_id:
                conversation.user2_unread_count = 0

            self.db.add(conversation)
            self.db.commit()