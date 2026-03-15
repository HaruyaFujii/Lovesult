from datetime import datetime
from typing import List, Optional, Tuple, Union
from uuid import UUID

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from packages.models.post import Post
from packages.models.reply import Reply
from packages.models.user import UserStatus
from packages.repositories.post_repository import PostRepository
from packages.repositories.user_repository import UserRepository
from packages.services.like_service import LikeService


class TimelineService:
    def __init__(self, session: AsyncSession):
        self.post_repository = PostRepository(session)
        self.user_repository = UserRepository(session)
        self.like_service = LikeService(session)
        self.session = session

    async def _get_replies_count(self, post_id: UUID) -> int:
        """投稿のリプライ数を取得"""
        result = await self.session.execute(
            select(func.count(Reply.id)).where(Reply.post_id == post_id)
        )
        return result.scalar() or 0

    async def get_timeline(
        self,
        current_user_id: Optional[UUID] = None,
        status_filter: Optional[str] = None,
        tab: Optional[str] = None,  # "all" or "following"
        cursor: Optional[str] = None,
        limit: int = 20,
    ) -> Tuple[List[dict], Optional[str]]:
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
            posts = await self._add_like_status_to_posts(posts, current_user_id)
            return posts, next_cursor

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
            posts = await self._add_like_status_to_posts(posts, current_user_id)
            return posts, next_cursor

        # ユーザーがログインしている場合、そのステータスに基づいてフィルタリング
        if current_user_id:
            user = await self.user_repository.get_by_id(current_user_id)
            if user:
                posts, next_cursor = await self.post_repository.get_mixed_timeline(
                    user_status=user.status,
                    cursor=cursor_datetime,
                    limit=limit,
                )
                posts = await self._add_like_status_to_posts(posts, current_user_id)
                return posts, next_cursor

        # ログインしていない場合は全投稿を返す
        posts, next_cursor = await self.post_repository.get_timeline(
            cursor=cursor_datetime, limit=limit
        )
        posts = await self._add_like_status_to_posts(posts, current_user_id)
        return posts, next_cursor

    async def _add_like_status_to_posts(
        self, posts: List[Post], current_user_id: Optional[UUID]
    ) -> List[dict]:
        """投稿リストにログインユーザーのいいね状態を追加"""
        result = []

        for post in posts:
            # Postオブジェクトを辞書に変換
            post_dict = post.model_dump()

            # ユーザー情報を手動で追加
            if post.user:
                post_dict["user"] = post.user.model_dump()
            else:
                post_dict["user"] = None

            # いいね状態を追加
            if current_user_id:
                post_dict["is_liked"] = await self.like_service.is_liked(
                    current_user_id, post.id
                )
            else:
                post_dict["is_liked"] = False

            # リプライ数を追加
            post_dict["replies_count"] = await self._get_replies_count(post.id)

            result.append(post_dict)

        return result
