from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


# リクエスト
class ConversationCreate(BaseModel):
    partner_id: UUID


class MessageCreate(BaseModel):
    content: str = Field(min_length=1, max_length=1000)


# レスポンス
class UserBrief(BaseModel):
    id: UUID
    nickname: str
    avatar_url: Optional[str] = None


class MessageResponse(BaseModel):
    id: UUID
    sender_id: UUID
    sender: Optional[UserBrief] = None
    content: str
    created_at: datetime
    is_mine: bool


class ConversationResponse(BaseModel):
    id: UUID
    partner: Optional[UserBrief] = None
    last_message: Optional[MessageResponse] = None
    unread_count: int
    updated_at: datetime


class ConversationListResponse(BaseModel):
    conversations: List[ConversationResponse]
    cursor: Optional[str] = None


class MessageListResponse(BaseModel):
    messages: List[MessageResponse]
    cursor: Optional[str] = None


class ConversationDetailResponse(BaseModel):
    id: UUID
    partner: Optional[UserBrief] = None
    created_at: datetime