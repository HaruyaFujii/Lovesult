from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel

from packages.models.message import MessageType, MessageStatus


class MessageCreate(BaseModel):
    recipient_id: UUID
    content: str
    message_type: MessageType = MessageType.TEXT
    reply_to_id: Optional[UUID] = None


class MessageUpdate(BaseModel):
    status: Optional[MessageStatus] = None


class UserInfo(BaseModel):
    id: UUID
    nickname: str
    avatar_url: Optional[str] = None


class MessageResponse(BaseModel):
    id: UUID
    sender_id: UUID
    recipient_id: UUID
    conversation_id: UUID
    content: str
    message_type: MessageType
    status: MessageStatus
    created_at: datetime
    updated_at: datetime
    read_at: Optional[datetime] = None
    reply_to_id: Optional[UUID] = None

    # Sender info for display
    sender: Optional[UserInfo] = None
    recipient: Optional[UserInfo] = None


class ConversationCreate(BaseModel):
    user_id: UUID


class ConversationResponse(BaseModel):
    id: UUID
    user1_id: UUID
    user2_id: UUID
    last_message: Optional[MessageResponse] = None
    unread_count: int
    created_at: datetime
    updated_at: datetime

    # Other user info for display
    other_user: Optional[UserInfo] = None


class ConversationListResponse(BaseModel):
    conversations: List[ConversationResponse]
    total: int


class MessageListResponse(BaseModel):
    messages: List[MessageResponse]
    total: int
    has_more: bool