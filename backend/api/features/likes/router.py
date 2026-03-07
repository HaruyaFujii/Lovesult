from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from api.core.dependencies import get_current_user_id, get_db
from .usecase import LikeUseCase

router = APIRouter(prefix="/posts", tags=["likes"])


@router.post("/{post_id}/like", operation_id="likePost")
async def like_post(
    post_id: UUID,
    current_user_id: UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    usecase = LikeUseCase(db)
    result = await usecase.like_post(current_user_id, post_id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already liked this post"
        )
    return {"message": "Successfully liked post"}


@router.delete("/{post_id}/like", operation_id="unlikePost")
async def unlike_post(
    post_id: UUID,
    current_user_id: UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    usecase = LikeUseCase(db)
    result = await usecase.unlike_post(current_user_id, post_id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Not liked this post"
        )
    return {"message": "Successfully unliked post"}