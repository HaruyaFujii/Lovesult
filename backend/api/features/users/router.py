from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from api.core.dependencies import get_current_user_id, get_db, get_optional_current_user_id

from .schemas import UserResponse, UserUpdate
from .usecase import UserUseCase

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", operation_id="getUsers")
async def get_users(
    limit: int = Query(50, ge=1, le=100, description="Number of results to return"),
    cursor: str | None = Query(None, description="Pagination cursor"),
    current_user_id: UUID | None = Depends(get_optional_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """全ユーザーを取得"""
    usecase = UserUseCase(db)
    users = await usecase.get_all_users(limit=limit, cursor=cursor)
    return {"users": users, "total": len(users)}


@router.get("/me", response_model=UserResponse, operation_id="getCurrentUser")
async def get_current_user(
    current_user_id: UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    usecase = UserUseCase(db)
    try:
        user = await usecase.get_user(current_user_id)
        return user
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from e


@router.put("/me", response_model=UserResponse, operation_id="updateCurrentUser")
async def update_current_user(
    user_update: UserUpdate,
    current_user_id: UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    usecase = UserUseCase(db)
    try:
        user = await usecase.update_user(current_user_id, user_update)
        return user
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from e


@router.get("/{user_id}", response_model=UserResponse, operation_id="getUser")
async def get_user(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    usecase = UserUseCase(db)
    try:
        user = await usecase.get_user(user_id)
        return user
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from e


@router.get("/{user_id}/posts", operation_id="getUserPosts")
async def get_user_posts(
    user_id: UUID,
    cursor: str | None = Query(None, description="Pagination cursor"),
    limit: int = Query(20, ge=1, le=100, description="Number of results to return"),
    current_user_id: UUID | None = Depends(get_optional_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> Any:
    from packages.services.post_service import PostService

    # ユーザーが存在するか確認
    user_usecase = UserUseCase(db)
    try:
        await user_usecase.get_user(user_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found") from e

    # 投稿を取得（いいね状態も含める）
    post_service = PostService(db)
    posts, next_cursor = await post_service.get_user_posts(user_id, current_user_id, cursor, limit)

    # 循環参照を避けるため、ここでインポート
    from api.features.posts.schemas import TimelineResponse

    return TimelineResponse(posts=posts, next_cursor=next_cursor)


@router.post("/me/avatar", response_model=UserResponse, operation_id="uploadUserAvatar")
async def upload_user_avatar(
    file: UploadFile = File(...),
    current_user_id: UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    """ユーザーのアバター画像をアップロードする"""
    # ファイルサイズとタイプのチェック
    if file.size and file.size > 5 * 1024 * 1024:  # 5MB制限
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File size must be less than 5MB",
        )

    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"File must be an image. Received: {file.content_type}",
        )

    usecase = UserUseCase(db)
    try:
        # ファイルデータを読み込む
        file_data = await file.read()

        # アバターをアップロードしてプロフィールを更新
        user = await usecase.upload_avatar(
            user_id=current_user_id, file_data=file_data, content_type=file.content_type
        )

        return user
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unexpected error: {str(e)}",
        ) from e
