from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from api.core.dependencies import get_current_user_id, get_db
from .schemas import (
    ConversationCreate,
    ConversationDetailResponse,
    ConversationListResponse,
    MessageCreate,
    MessageListResponse,
    MessageResponse,
)
from .usecase import DMUseCase

router = APIRouter(prefix="/conversations", tags=["dm"])


@router.get("", response_model=ConversationListResponse)
async def get_conversations(
    cursor: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=50),
    current_user_id: UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> ConversationListResponse:
    """会話一覧を取得"""
    usecase = DMUseCase(db)
    return await usecase.get_conversations(
        user_id=current_user_id,
        cursor=cursor,
        limit=limit,
    )


@router.post("", response_model=ConversationDetailResponse, status_code=status.HTTP_201_CREATED)
async def create_conversation(
    data: ConversationCreate,
    current_user_id: UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> ConversationDetailResponse:
    """会話を作成（または既存を取得）"""
    usecase = DMUseCase(db)
    try:
        return await usecase.get_or_create_conversation(
            user_id=current_user_id,
            data=data,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/{conversation_id}", response_model=ConversationDetailResponse)
async def get_conversation(
    conversation_id: UUID,
    current_user_id: UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> ConversationDetailResponse:
    """会話詳細を取得"""
    usecase = DMUseCase(db)
    try:
        return await usecase.get_conversation(
            user_id=current_user_id,
            conversation_id=conversation_id,
        )
    except PermissionError:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a participant")


@router.get("/{conversation_id}/messages", response_model=MessageListResponse)
async def get_messages(
    conversation_id: UUID,
    cursor: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    current_user_id: UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> MessageListResponse:
    """メッセージ一覧を取得"""
    usecase = DMUseCase(db)
    try:
        return await usecase.get_messages(
            user_id=current_user_id,
            conversation_id=conversation_id,
            cursor=cursor,
            limit=limit,
        )
    except PermissionError:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a participant")


@router.post("/{conversation_id}/messages", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def send_message(
    conversation_id: UUID,
    data: MessageCreate,
    current_user_id: UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    """メッセージを送信"""
    usecase = DMUseCase(db)
    try:
        return await usecase.send_message(
            user_id=current_user_id,
            conversation_id=conversation_id,
            data=data,
        )
    except PermissionError:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a participant")
    # TODO: 課金チェック追加時
    # except PaymentRequired as e:
    #     raise HTTPException(status_code=status.HTTP_402_PAYMENT_REQUIRED, detail=str(e))


@router.put("/{conversation_id}/read", status_code=status.HTTP_204_NO_CONTENT)
async def mark_as_read(
    conversation_id: UUID,
    current_user_id: UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> None:
    """既読にする"""
    usecase = DMUseCase(db)
    await usecase.mark_as_read(
        user_id=current_user_id,
        conversation_id=conversation_id,
    )