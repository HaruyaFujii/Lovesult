from datetime import datetime
from typing import Any
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from packages.models.post import Post
from packages.repositories.post_repository import PostRepository
from packages.services.like_service import LikeService
from packages.services.notification_service import NotificationService


class PostService:
    def __init__(self, session: AsyncSession):
        self.repository = PostRepository(session)
        self.like_service = LikeService(session)
        self.notification_service = NotificationService(session)
        self.session = session

    async def _get_replies_count(self, post_id: UUID) -> int:
        """投稿のリプライ数を取得"""
        result = await self.session.execute(
            select(func.count(Post.id)).where(Post.parent_id == post_id)  # type: ignore
        )
        return result.scalar() or 0

    async def create_post(self, user_id: UUID, content: str, parent_id: UUID | None = None) -> Post:
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

        # Determine root_id for replies
        root_id = None
        if parent_id:
            parent_post = await self.repository.get_by_id(parent_id)
            if not parent_post:
                raise ValueError("Parent post not found")
            # If parent has a root_id, use it; otherwise parent is the root
            root_id = parent_post.root_id if parent_post.root_id else parent_id

        post = Post(
            user_id=user_id,
            content=content,
            parent_id=parent_id,
            root_id=root_id,
            author_status=user.status,
            author_age_range=user.age_range,
        )
        created_post = await self.repository.create(post)

        # Update parent's reply count if this is a reply
        if parent_id and parent_post:
            parent_post.replies_count = (parent_post.replies_count or 0) + 1
            await self.repository.update(parent_post)

            # Create notification for reply
            if parent_post.user_id != user_id:
                await self.notification_service.create_reply_notification(
                    post_id=parent_id,
                    post_author_id=parent_post.user_id,
                    reply_id=created_post.id,
                    replier_id=user_id,
                )

        await self.repository.session.commit()

        # ユーザー情報を含めて再取得
        result = await self.repository.session.execute(
            select(Post).where(Post.id == created_post.id).options(selectinload(Post.user))  # type: ignore
        )
        return result.scalar_one()

    async def get_post(
        self, post_id: UUID, current_user_id: UUID | None = None
    ) -> dict[str, Any] | None:
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
            post_dict["is_liked"] = await self.like_service.is_liked(current_user_id, post_id)
        else:
            post_dict["is_liked"] = False

        # リプライ数を追加
        post_dict["replies_count"] = await self._get_replies_count(post_id)

        return post_dict

    async def update_post(self, post_id: UUID, user_id: UUID, content: str) -> Post | None:
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

        # Update parent's reply count if this is a reply
        if post.parent_id:
            parent_post = await self.repository.get_by_id(post.parent_id)
            if parent_post:
                parent_post.replies_count = max(0, (parent_post.replies_count or 0) - 1)
                await self.repository.update(parent_post)

        result = await self.repository.delete(post_id)
        await self.repository.session.commit()
        return result

    async def get_replies(
        self, post_id: UUID, current_user_id: UUID | None = None
    ) -> list[dict[str, Any]]:
        """Get first-level replies for a post"""
        # Get all replies for this post
        result = await self.session.execute(
            select(Post)
            .where(Post.parent_id == post_id)
            .options(selectinload(Post.user))
            .order_by(Post.created_at)  # type: ignore
        )
        replies = result.scalars().all()

        # Convert to dict and add like status
        reply_list = []
        for reply in replies:
            reply_dict = reply.model_dump()

            # Add user info
            if reply.user:
                reply_dict["user"] = reply.user.model_dump()
            else:
                reply_dict["user"] = None

            # Add like status
            if current_user_id:
                reply_dict["is_liked"] = await self.like_service.is_liked(current_user_id, reply.id)
            else:
                reply_dict["is_liked"] = False

            # Add has_replies flag
            reply_dict["has_replies"] = (reply.replies_count or 0) > 0

            reply_list.append(reply_dict)

        return reply_list

    async def get_user_posts(
        self,
        user_id: UUID,
        current_user_id: UUID | None = None,
        cursor: str | None = None,
        limit: int = 20,
    ) -> tuple[list[dict[str, Any]], str | None]:
        cursor_datetime = None
        if cursor:
            cursor_datetime = datetime.fromisoformat(cursor)

        posts, next_cursor = await self.repository.get_user_posts(user_id, cursor_datetime, limit)

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
                post_dict["is_liked"] = await self.like_service.is_liked(current_user_id, post.id)
            else:
                post_dict["is_liked"] = False

            # リプライ数を追加
            post_dict["replies_count"] = await self._get_replies_count(post.id)

            result.append(post_dict)

        return result, next_cursor
