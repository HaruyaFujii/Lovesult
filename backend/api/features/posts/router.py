from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from api.core.dependencies import get_current_user_id, get_db, get_optional_current_user_id

from .schemas import PostCreate, PostResponse, PostUpdate, RepliesResponse, TimelineResponse
from .usecase import PostUseCase

router = APIRouter(prefix="/posts", tags=["posts"])


@router.get("", response_model=TimelineResponse, operation_id="getPosts")
async def get_posts(
    status: str | None = Query(None, description="ステータスフィルター"),
    tab: str | None = Query(None, description="タブフィルター (all/following)"),
    cursor: str | None = Query(None, description="ページネーションカーソル"),
    limit: int = Query(20, ge=1, le=100, description="取得件数"),
    current_user_id: UUID | None = Depends(get_optional_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> TimelineResponse:
    usecase = PostUseCase(db)
    posts, next_cursor = await usecase.get_timeline(
        current_user_id=current_user_id,
        status_filter=status,
        tab=tab,
        cursor=cursor,
        limit=limit,
    )
    return TimelineResponse(posts=posts, next_cursor=next_cursor)


@router.post(
    "", response_model=PostResponse, status_code=status.HTTP_201_CREATED, operation_id="createPost"
)
async def create_post(
    post_data: PostCreate,
    current_user_id: UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> PostResponse:
    usecase = PostUseCase(db)
    post = await usecase.create_post(current_user_id, post_data)
    return post


@router.get("/{post_id}", response_model=PostResponse, operation_id="getPost")
async def get_post(
    post_id: UUID,
    current_user_id: UUID | None = Depends(get_optional_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> PostResponse:
    usecase = PostUseCase(db)
    try:
        post = await usecase.get_post(post_id, current_user_id)
        return post
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from e


@router.put("/{post_id}", response_model=PostResponse, operation_id="updatePost")
async def update_post(
    post_id: UUID,
    post_data: PostUpdate,
    current_user_id: UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> PostResponse:
    usecase = PostUseCase(db)
    try:
        post = await usecase.update_post(post_id, current_user_id, post_data)
        return post
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from e


@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT, operation_id="deletePost")
async def delete_post(
    post_id: UUID,
    current_user_id: UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> None:
    usecase = PostUseCase(db)
    try:
        await usecase.delete_post(post_id, current_user_id)
        return None
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from e


@router.get("/{post_id}/replies", response_model=RepliesResponse, operation_id="getReplies")
async def get_replies(
    post_id: UUID,
    current_user_id: UUID | None = Depends(get_optional_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> RepliesResponse:
    """Get replies for a specific post"""
    usecase = PostUseCase(db)
    replies = await usecase.get_replies(post_id, current_user_id)
    return RepliesResponse(replies=replies)
