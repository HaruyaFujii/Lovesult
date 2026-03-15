from datetime import datetime
from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from packages.models.post import Post
from packages.models.reply import Reply
from packages.repositories.post_repository import PostRepository
from packages.services.content_filter_service import ContentFilterService
from packages.services.like_service import LikeService


class PostService:
    def __init__(self, session: AsyncSession):
        self.repository = PostRepository(session)
        self.like_service = LikeService(session)
        self.session = session

    async def _get_replies_count(self, post_id: UUID) -> int:
        """投稿のリプライ数を取得"""
        result = await self.session.execute(
            select(func.count(Reply.id)).where(Reply.post_id == post_id)
        )
        return result.scalar() or 0

    async def create_post(self, user_id: UUID, content: str) -> Post:
        # コンテンツフィルタリング - temporarily disabled due to banned_words table schema issue
        # filter_service = ContentFilterService(self.repository.session)
        # filter_result = await filter_service.check_content(content)

        # if not filter_result.is_safe:
        #     raise ValueError("不適切な表現が含まれているため投稿できません")

        # ユーザー情報を取得してスナップショットとして保存
        from packages.services.user_service import UserService

        user_service = UserService(self.repository.session)
        user = await user_service.get_user(user_id)

        if not user:
            raise ValueError("User not found")

        post = Post(
            user_id=user_id,
            content=content,
            author_status=user.status,
            author_age_range=user.age_range,
        )
        created_post = await self.repository.create(post)
        await self.repository.session.commit()

        # ユーザー情報を含めて再取得
        result = await self.repository.session.execute(
            select(Post)
            .where(Post.id == created_post.id)
            .options(selectinload(Post.user))
        )
        return result.scalar_one()

    async def get_post(
        self, post_id: UUID, current_user_id: Optional[UUID] = None
    ) -> Optional[dict]:
        post = await self.repository.get_by_id(post_id)
        if not post:
            return None

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
                current_user_id, post_id
            )
        else:
            post_dict["is_liked"] = False

        # リプライ数を追加
        post_dict["replies_count"] = await self._get_replies_count(post_id)

        return post_dict

    async def update_post(
        self, post_id: UUID, user_id: UUID, content: str
    ) -> Optional[Post]:
        # コンテンツフィルタリング - temporarily disabled due to banned_words table schema issue
        # filter_service = ContentFilterService(self.repository.session)
        # filter_result = await filter_service.check_content(content)

        # if not filter_result.is_safe:
        #     raise ValueError("不適切な表現が含まれているため投稿できません")

        post = await self.repository.get_by_id(post_id)
        if not post or post.user_id != user_id:
            return None

        post.content = content
        updated_post = await self.repository.update(post)
        await self.repository.session.commit()
        return updated_post

    async def delete_post(self, post_id: UUID, user_id: UUID) -> bool:
        post = await self.repository.get_by_id(post_id)
        if not post or post.user_id != user_id:
            return False

        result = await self.repository.delete(post_id)
        await self.repository.session.commit()
        return result

    async def get_user_posts(
        self,
        user_id: UUID,
        current_user_id: Optional[UUID] = None,
        cursor: Optional[str] = None,
        limit: int = 20,
    ) -> Tuple[List[dict], Optional[str]]:
        cursor_datetime = None
        if cursor:
            cursor_datetime = datetime.fromisoformat(cursor)

        posts, next_cursor = await self.repository.get_user_posts(
            user_id, cursor_datetime, limit
        )

        # Postオブジェクトを辞書に変換し、いいね状態を追加
        result = []
        for post in posts:
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

        return result, next_cursor
