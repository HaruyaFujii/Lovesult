from collections.abc import Iterable
from uuid import UUID

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from packages.models.like import Like
from packages.models.post import Post
from packages.models.reply_like import ReplyLike


class LikeRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create_like(self, user_id: UUID, post_id: UUID) -> Like:
        like = Like(user_id=user_id, post_id=post_id)
        self.session.add(like)
        await self.session.flush()
        return like

    async def delete_like(self, user_id: UUID, post_id: UUID) -> bool:
        result = await self.session.execute(
            select(Like).where(and_(Like.user_id == user_id, Like.post_id == post_id))
        )
        like = result.scalar_one_or_none()

        if like:
            await self.session.delete(like)
            await self.session.flush()
            return True
        return False

    async def is_liked(self, user_id: UUID, post_id: UUID) -> bool:
        result = await self.session.execute(
            select(func.count(Like.id)).where(
                and_(Like.user_id == user_id, Like.post_id == post_id)
            )
        )
        count = result.scalar()
        return count > 0

    async def get_liked_post_ids(
        self, user_id: UUID, post_ids: Iterable[UUID]
    ) -> set[UUID]:
        """バッチ版 is_liked: 与えられた post_ids のうち user_id がいいねしているIDだけをsetで返す"""
        ids = list(post_ids)
        if not ids:
            return set()
        result = await self.session.execute(
            select(Like.post_id).where(
                and_(Like.user_id == user_id, Like.post_id.in_(ids))
            )
        )
        return {row[0] for row in result.all()}

    async def get_liked_reply_ids(
        self, user_id: UUID, reply_ids: Iterable[UUID]
    ) -> set[UUID]:
        """バッチ版 is_reply_liked: reply_ids のうち user_id がいいねしているIDのset"""
        ids = list(reply_ids)
        if not ids:
            return set()
        result = await self.session.execute(
            select(ReplyLike.reply_id).where(
                and_(ReplyLike.user_id == user_id, ReplyLike.reply_id.in_(ids))
            )
        )
        return {row[0] for row in result.all()}

    async def increment_like_count(self, post_id: UUID) -> None:
        # 投稿のいいね数を増やす
        post_result = await self.session.execute(select(Post).where(Post.id == post_id))
        post = post_result.scalar_one()
        post.likes_count += 1

    async def decrement_like_count(self, post_id: UUID) -> None:
        # 投稿のいいね数を減らす
        post_result = await self.session.execute(select(Post).where(Post.id == post_id))
        post = post_result.scalar_one()
        post.likes_count = max(0, post.likes_count - 1)
