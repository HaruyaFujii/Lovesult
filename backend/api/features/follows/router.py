from uuid import UUID
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from api.core.dependencies import get_current_user_id, get_db
from .schemas import FollowStatusResponse, FollowListResponse
from .usecase import FollowUseCase

router = APIRouter(prefix="/users", tags=["follows"])


@router.post("/{user_id}/follow", operation_id="followUser")
async def follow_user(
    user_id: UUID,
    current_user_id: UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    usecase = FollowUseCase(db)
    try:
        result = await usecase.follow_user(current_user_id, user_id)
        if not result:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Already following this user or invalid request"
            )
        return {"message": "Successfully followed user"}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.delete("/{user_id}/follow", operation_id="unfollowUser")
async def unfollow_user(
    user_id: UUID,
    current_user_id: UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    usecase = FollowUseCase(db)
    result = await usecase.unfollow_user(current_user_id, user_id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Not following this user"
        )
    return {"message": "Successfully unfollowed user"}


@router.get("/{user_id}/follow-status", response_model=FollowStatusResponse, operation_id="getFollowStatus")
async def get_follow_status(
    user_id: UUID,
    current_user_id: UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    usecase = FollowUseCase(db)
    status_data = await usecase.get_follow_status(current_user_id, user_id)
    return FollowStatusResponse(**status_data)


@router.get("/{user_id}/followers", response_model=FollowListResponse, operation_id="getFollowers")
async def get_followers(
    user_id: UUID,
    cursor: Optional[str] = Query(None, description="Pagination cursor"),
    limit: int = Query(20, ge=1, le=100, description="Number of results to return"),
    db: AsyncSession = Depends(get_db),
):
    usecase = FollowUseCase(db)
    users, next_cursor = await usecase.get_followers(user_id, cursor, limit)
    return FollowListResponse(users=users, next_cursor=next_cursor)


@router.get("/{user_id}/following", response_model=FollowListResponse, operation_id="getFollowing")
async def get_following(
    user_id: UUID,
    cursor: Optional[str] = Query(None, description="Pagination cursor"),
    limit: int = Query(20, ge=1, le=100, description="Number of results to return"),
    db: AsyncSession = Depends(get_db),
):
    usecase = FollowUseCase(db)
    users, next_cursor = await usecase.get_following(user_id, cursor, limit)
    return FollowListResponse(users=users, next_cursor=next_cursor)