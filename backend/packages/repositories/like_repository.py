from typing import Optional
from uuid import UUID

from sqlalchemy import select, func, and_, delete
from sqlalchemy.ext.asyncio import AsyncSession

from packages.models.like import Like
from packages.models.post import Post


class LikeRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create_like(self, user_id: UUID, post_id: UUID) -> Like:
        like = Like(
            user_id=user_id,
            post_id=post_id
        )
        self.session.add(like)
        await self.session.flush()
        return like

    async def delete_like(self, user_id: UUID, post_id: UUID) -> bool:
        result = await self.session.execute(
            select(Like).where(
                and_(
                    Like.user_id == user_id,
                    Like.post_id == post_id
                )
            )
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
                and_(
                    Like.user_id == user_id,
                    Like.post_id == post_id
                )
            )
        )
        count = result.scalar()
        return count > 0

    async def increment_like_count(self, post_id: UUID):
        # 投稿のいいね数を増やす
        await self.session.execute(
            select(Post).where(Post.id == post_id).with_for_update()
        )
        post_result = await self.session.execute(
            select(Post).where(Post.id == post_id)
        )
        post = post_result.scalar_one()
        post.likes_count += 1

    async def decrement_like_count(self, post_id: UUID):
        # 投稿のいいね数を減らす
        await self.session.execute(
            select(Post).where(Post.id == post_id).with_for_update()
        )
        post_result = await self.session.execute(
            select(Post).where(Post.id == post_id)
        )
        post = post_result.scalar_one()
        post.likes_count = max(0, post.likes_count - 1)