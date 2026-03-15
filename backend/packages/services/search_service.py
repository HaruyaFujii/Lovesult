from datetime import datetime
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from packages.models.user import UserStatus
from packages.repositories.post_repository import PostRepository
from packages.repositories.user_repository import UserRepository
from packages.services.like_service import LikeService


class SearchService:
    def __init__(self, session: AsyncSession):
        self.post_repository = PostRepository(session)
        self.user_repository = UserRepository(session)
        self.like_service = LikeService(session)

    async def search_posts(
        self,
        query: str | None = None,
        status_filter: str | None = None,
        age_range_filter: str | None = None,
        current_user_id: UUID | None = None,
        cursor: str | None = None,
        limit: int = 20,
    ) -> tuple[list[dict], str | None]:
        """
        投稿を検索する

        Args:
            query: 検索クエリ（投稿内容を検索）
            status_filter: ステータスフィルター
            age_range_filter: 年齢範囲フィルター
            current_user_id: 現在のユーザーID
            cursor: ページネーション用カーソル
            limit: 取得件数

        Returns:
            検索結果の投稿リストと次のカーソル
        """
        cursor_datetime = None
        if cursor:
            cursor_datetime = datetime.fromisoformat(cursor)

        # 検索実行
        posts, next_cursor = await self.post_repository.search_posts(
            query=query,
            status_filter=UserStatus(status_filter) if status_filter else None,
            age_range_filter=age_range_filter,
            exclude_user_id=current_user_id,
            cursor=cursor_datetime,
            limit=limit,
        )

        # いいね・ブックマーク状態を追加
        result = []
        for post in posts:
            post_dict = post.model_dump()

            # ユーザー情報を追加
            if post.user:
                post_dict["user"] = post.user.model_dump()
            else:
                post_dict["user"] = None

            # いいね・ブックマーク状態を追加
            if current_user_id:
                post_dict["is_liked"] = await self.like_service.is_liked(current_user_id, post.id)
            else:
                post_dict["is_liked"] = False

            result.append(post_dict)

        return result, next_cursor

    async def search_users(
        self,
        query: str | None = None,
        status_filter: str | None = None,
        age_range_filter: str | None = None,
        current_user_id: UUID | None = None,
        cursor: str | None = None,
        limit: int = 20,
    ) -> tuple[list[dict], str | None]:
        """
        ユーザーを検索する

        Args:
            query: 検索クエリ（ニックネームとbioを検索）
            status_filter: ステータスフィルター
            age_range_filter: 年齢範囲フィルター
            current_user_id: 現在のユーザーID
            cursor: ページネーション用カーソル
            limit: 取得件数

        Returns:
            検索結果のユーザーリストと次のカーソル
        """
        cursor_datetime = None
        if cursor:
            cursor_datetime = datetime.fromisoformat(cursor)

        # 検索実行
        users, next_cursor = await self.user_repository.search_users(
            query=query,
            status_filter=UserStatus(status_filter) if status_filter else None,
            age_range_filter=age_range_filter,
            exclude_user_id=current_user_id,
            cursor=cursor_datetime,
            limit=limit,
        )

        # ユーザー情報を辞書形式に変換
        result = []
        for user in users:
            user_dict = user.model_dump()
            result.append(user_dict)

        return result, next_cursor
