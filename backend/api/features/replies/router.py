from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from api.core.dependencies import get_current_user_id, get_db
from .schemas import RepliesResponse, ReplyCreate, ReplyResponse
from .usecase import ReplyUseCase

router = APIRouter(tags=["replies"])


@router.get("/posts/{post_id}/replies", response_model=RepliesResponse, operation_id="getReplies")
async def get_replies(
    post_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    usecase = ReplyUseCase(db)
    replies = await usecase.get_replies(post_id)
    return RepliesResponse(replies=replies)


@router.post(
    "/posts/{post_id}/replies",
    response_model=ReplyResponse,
    status_code=status.HTTP_201_CREATED,
    operation_id="createReply",
)
async def create_reply(
    post_id: UUID,
    reply_data: ReplyCreate,
    current_user_id: UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    usecase = ReplyUseCase(db)
    reply = await usecase.create_reply(post_id, current_user_id, reply_data)
    return reply


@router.delete("/replies/{reply_id}", status_code=status.HTTP_204_NO_CONTENT, operation_id="deleteReply")
async def delete_reply(
    reply_id: UUID,
    current_user_id: UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    usecase = ReplyUseCase(db)
    try:
        await usecase.delete_reply(reply_id, current_user_id)
        return None
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )