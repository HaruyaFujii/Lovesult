from datetime import datetime
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
    avatar_url: str | None = None


class MessageResponse(BaseModel):
    id: UUID
    sender_id: UUID
    sender: UserBrief | None = None
    content: str
    created_at: datetime
    is_mine: bool


class ConversationResponse(BaseModel):
    id: UUID
    partner: UserBrief | None = None
    last_message: MessageResponse | None = None
    unread_count: int
    updated_at: datetime


class ConversationListResponse(BaseModel):
    conversations: list[ConversationResponse]
    cursor: str | None = None


class MessageListResponse(BaseModel):
    messages: list[MessageResponse]
    cursor: str | None = None


class ConversationDetailResponse(BaseModel):
    id: UUID
    partner: UserBrief | None = None
    created_at: datetime
