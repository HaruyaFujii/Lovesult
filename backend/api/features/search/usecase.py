from datetime import datetime
from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from packages.services.search_service import SearchService
from .schemas import SearchFilters, PostSearchResponse, UserSearchResponse
from api.features.posts.schemas import PostResponse
from api.features.users.schemas import UserResponse


class SearchUseCase:
    def __init__(self, session: AsyncSession):
        self.search_service = SearchService(session)

    async def search_posts(
        self,
        query: Optional[str] = None,
        filters: Optional[SearchFilters] = None,
        current_user_id: Optional[UUID] = None,
        cursor: Optional[str] = None,
        limit: int = 20
    ) -> PostSearchResponse:
        """
        投稿を検索する

        Args:
            query: 検索クエリ
            filters: 検索フィルター
            current_user_id: 現在のユーザーID
            cursor: ページネーション用カーソル
            limit: 取得件数

        Returns:
            検索結果
        """
        # フィルターを展開
        status_filter = filters.status if filters else None
        age_range_filter = filters.age_range if filters else None

        # 検索実行
        posts, next_cursor = await self.search_service.search_posts(
            query=query,
            status_filter=status_filter,
            age_range_filter=age_range_filter,
            current_user_id=current_user_id,
            cursor=cursor,
            limit=limit
        )

        # レスポンスに変換
        post_responses = [PostResponse(**post) for post in posts]

        return PostSearchResponse(
            posts=post_responses,
            next_cursor=next_cursor
        )

    async def search_users(
        self,
        query: Optional[str] = None,
        filters: Optional[SearchFilters] = None,
        current_user_id: Optional[UUID] = None,
        cursor: Optional[str] = None,
        limit: int = 20
    ) -> UserSearchResponse:
        """
        ユーザーを検索する

        Args:
            query: 検索クエリ
            filters: 検索フィルター
            current_user_id: 現在のユーザーID
            cursor: ページネーション用カーソル
            limit: 取得件数

        Returns:
            検索結果
        """
        # フィルターを展開
        status_filter = filters.status if filters else None
        age_range_filter = filters.age_range if filters else None

        # 検索実行
        users, next_cursor = await self.search_service.search_users(
            query=query,
            status_filter=status_filter,
            age_range_filter=age_range_filter,
            current_user_id=current_user_id,
            cursor=cursor,
            limit=limit
        )

        # レスポンスに変換
        user_responses = [UserResponse(**user) for user in users]

        return UserSearchResponse(
            users=user_responses,
            next_cursor=next_cursor
        )