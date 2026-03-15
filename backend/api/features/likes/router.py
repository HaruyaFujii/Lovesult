from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from api.core.dependencies import get_current_user_id, get_db

from .usecase import LikeUseCase

router = APIRouter(tags=["likes"])


@router.post("/posts/{post_id}/like", operation_id="likePost")
async def like_post(
    post_id: UUID,
    current_user_id: UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> dict[str, str]:
    usecase = LikeUseCase(db)
    result = await usecase.like_post(current_user_id, post_id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Already liked this post"
        )
    return {"message": "Successfully liked post"}


@router.delete("/posts/{post_id}/like", operation_id="unlikePost")
async def unlike_post(
    post_id: UUID,
    current_user_id: UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> dict[str, str]:
    usecase = LikeUseCase(db)
    result = await usecase.unlike_post(current_user_id, post_id)
    if not result:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Not liked this post")
    return {"message": "Successfully unliked post"}


@router.post("/replies/{reply_id}/like", operation_id="likeReply")
async def like_reply(
    reply_id: UUID,
    current_user_id: UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> dict[str, str]:
    usecase = LikeUseCase(db)
    result = await usecase.like_reply(current_user_id, reply_id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Already liked this reply"
        )
    return {"message": "Successfully liked reply"}


@router.delete("/replies/{reply_id}/like", operation_id="unlikeReply")
async def unlike_reply(
    reply_id: UUID,
    current_user_id: UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> dict[str, str]:
    usecase = LikeUseCase(db)
    result = await usecase.unlike_reply(current_user_id, reply_id)
    if not result:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Not liked this reply")
    return {"message": "Successfully unliked reply"}
