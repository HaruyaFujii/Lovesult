from collections.abc import Sequence
from datetime import datetime
from typing import Any
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from packages.models.post import Post

# from packages.models.reply import Reply  # Replies are now stored in posts table
from packages.models.user import UserStatus
from packages.repositories.like_repository import LikeRepository
from packages.repositories.post_repository import PostRepository
from packages.repositories.user_repository import UserRepository
from packages.services.like_service import LikeService


class TimelineService:
    def __init__(self, session: AsyncSession):
        self.post_repository = PostRepository(session)
        self.user_repository = UserRepository(session)
        self.like_repository = LikeRepository(session)
        self.like_service = LikeService(session)
        self.session = session

    async def get_timeline(
        self,
        current_user_id: UUID | None = None,
        status_filter: str | None = None,
        tab: str | None = None,  # "all" or "following"
        cursor: str | None = None,
        limit: int = 20,
    ) -> tuple[list[dict[str, Any]], str | None]:
        cursor_datetime = None
        if cursor:
            cursor_datetime = datetime.fromisoformat(cursor)

        # フォロー中タブが指定された場合
        if tab == "following" and current_user_id:
            posts, next_cursor = await self.post_repository.get_following_timeline(
                user_id=current_user_id,
                cursor=cursor_datetime,
                limit=limit,
            )
            enriched = await self._add_like_status_to_posts(posts, current_user_id)
            return enriched, next_cursor

        # ステータスフィルターが指定された場合
        if status_filter:
            try:
                status = UserStatus(status_filter)
                posts, next_cursor = await self.post_repository.get_timeline(
                    status_filter=status,
                    cursor=cursor_datetime,
                    limit=limit,
                )
            except ValueError:
                # 無効なステータスの場合は全投稿を返す
                posts, next_cursor = await self.post_repository.get_timeline(
                    cursor=cursor_datetime, limit=limit
                )
            enriched = await self._add_like_status_to_posts(posts, current_user_id)
            return enriched, next_cursor

        # ユーザーがログインしている場合、そのステータスに基づいてフィルタリング
        if current_user_id:
            user = await self.user_repository.get_by_id(current_user_id)
            if user:
                posts, next_cursor = await self.post_repository.get_mixed_timeline(
                    user_status=user.status,
                    cursor=cursor_datetime,
                    limit=limit,
                )
                enriched = await self._add_like_status_to_posts(posts, current_user_id)
                return enriched, next_cursor

        # ログインしていない場合は全投稿を返す
        posts, next_cursor = await self.post_repository.get_timeline(
            cursor=cursor_datetime, limit=limit
        )
        enriched = await self._add_like_status_to_posts(posts, current_user_id)
        return enriched, next_cursor

    async def _add_like_status_to_posts(
        self, posts: Sequence[Post], current_user_id: UUID | None
    ) -> list[dict[str, Any]]:
        """投稿リストにログインユーザーのいいね状態とリプライ数を追加(N+1回避のバッチ版)"""
        if not posts:
            return []

        post_ids = [p.id for p in posts]

        # いいね状態を1クエリで取得
        if current_user_id:
            liked_ids = await self.like_repository.get_liked_post_ids(current_user_id, post_ids)
        else:
            liked_ids = set()

        # リプライ数を1クエリで取得
        reply_counts = await self.post_repository.get_reply_counts(post_ids)

        result: list[dict[str, Any]] = []
        for post in posts:
            post_dict = post.model_dump()
            post_dict["user"] = post.user.model_dump() if post.user else None
            post_dict["is_liked"] = post.id in liked_ids
            post_dict["replies_count"] = reply_counts.get(post.id, 0)
            result.append(post_dict)

        return result
