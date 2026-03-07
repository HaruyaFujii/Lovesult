from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from api.core.dependencies import get_current_user_id_optional, get_db
from .schemas import SearchFilters, SearchResponse
from .usecase import SearchUseCase

router = APIRouter(prefix="/api/v1", tags=["search"])


@router.get("/search/posts", response_model=SearchResponse)
async def search_posts(
    db: AsyncSession = Depends(get_db),
    current_user_id: Optional[UUID] = Depends(get_current_user_id_optional),
    q: Optional[str] = Query(None, description="検索クエリ"),
    status: Optional[str] = Query(None, description="ステータスフィルター"),
    age_range: Optional[str] = Query(None, description="年齢範囲フィルター"),
    cursor: Optional[str] = Query(None, description="ページネーション用カーソル"),
    limit: int = Query(20, le=100, description="取得件数")
) -> SearchResponse:
    """
    投稿を検索する

    - **q**: 検索クエリ（投稿内容を検索）
    - **status**: ステータスフィルター (in_love, heartbroken, seeking)
    - **age_range**: 年齢範囲フィルター (teens, twenties, thirties, forties_plus)
    - **cursor**: ページネーション用カーソル
    - **limit**: 取得件数（最大100）
    """
    usecase = SearchUseCase(db)

    # フィルターを構築
    filters = None
    if status or age_range:
        filters = SearchFilters(status=status, age_range=age_range)

    return await usecase.search_posts(
        query=q,
        filters=filters,
        current_user_id=current_user_id,
        cursor=cursor,
        limit=limit
    )