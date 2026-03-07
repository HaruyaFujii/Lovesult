from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from packages.models.follow import Follow
from packages.models.user import User


class FollowRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create_follow(self, follower_id: UUID, following_id: UUID) -> Follow:
        follow = Follow(
            follower_id=follower_id,
            following_id=following_id
        )
        self.session.add(follow)
        await self.session.flush()
        return follow

    async def delete_follow(self, follower_id: UUID, following_id: UUID) -> bool:
        result = await self.session.execute(
            select(Follow).where(
                and_(
                    Follow.follower_id == follower_id,
                    Follow.following_id == following_id
                )
            )
        )
        follow = result.scalar_one_or_none()

        if follow:
            await self.session.delete(follow)
            await self.session.flush()
            return True
        return False

    async def is_following(self, follower_id: UUID, following_id: UUID) -> bool:
        result = await self.session.execute(
            select(func.count(Follow.id)).where(
                and_(
                    Follow.follower_id == follower_id,
                    Follow.following_id == following_id
                )
            )
        )
        count = result.scalar()
        return count > 0

    async def get_followers(
        self,
        user_id: UUID,
        cursor: Optional[str] = None,
        limit: int = 20
    ) -> Tuple[List[User], Optional[str]]:
        query = (
            select(User)
            .join(Follow, Follow.follower_id == User.id)
            .where(Follow.following_id == user_id)
            .order_by(Follow.created_at.desc(), User.id)
        )

        if cursor:
            # cursor is created_at timestamp + user_id
            cursor_parts = cursor.split('_')
            if len(cursor_parts) == 2:
                cursor_timestamp = cursor_parts[0]
                cursor_user_id = cursor_parts[1]
                query = query.where(
                    Follow.created_at < cursor_timestamp,
                    User.id < cursor_user_id
                )

        query = query.limit(limit + 1)
        result = await self.session.execute(query)
        users = result.scalars().all()

        next_cursor = None
        if len(users) > limit:
            users = users[:-1]
            if users:
                last_user = users[-1]
                # Get the follow relationship for cursor
                follow_result = await self.session.execute(
                    select(Follow).where(
                        and_(
                            Follow.follower_id == last_user.id,
                            Follow.following_id == user_id
                        )
                    )
                )
                follow = follow_result.scalar_one()
                next_cursor = f"{follow.created_at.isoformat()}_{last_user.id}"

        return list(users), next_cursor

    async def get_following(
        self,
        user_id: UUID,
        cursor: Optional[str] = None,
        limit: int = 20
    ) -> Tuple[List[User], Optional[str]]:
        query = (
            select(User)
            .join(Follow, Follow.following_id == User.id)
            .where(Follow.follower_id == user_id)
            .order_by(Follow.created_at.desc(), User.id)
        )

        if cursor:
            cursor_parts = cursor.split('_')
            if len(cursor_parts) == 2:
                cursor_timestamp = cursor_parts[0]
                cursor_user_id = cursor_parts[1]
                query = query.where(
                    Follow.created_at < cursor_timestamp,
                    User.id < cursor_user_id
                )

        query = query.limit(limit + 1)
        result = await self.session.execute(query)
        users = result.scalars().all()

        next_cursor = None
        if len(users) > limit:
            users = users[:-1]
            if users:
                last_user = users[-1]
                follow_result = await self.session.execute(
                    select(Follow).where(
                        and_(
                            Follow.follower_id == user_id,
                            Follow.following_id == last_user.id
                        )
                    )
                )
                follow = follow_result.scalar_one()
                next_cursor = f"{follow.created_at.isoformat()}_{last_user.id}"

        return list(users), next_cursor

    async def increment_follow_counts(self, follower_id: UUID, following_id: UUID):
        # Increment following_count for follower
        await self.session.execute(
            select(User).where(User.id == follower_id).with_for_update()
        )
        follower_result = await self.session.execute(
            select(User).where(User.id == follower_id)
        )
        follower = follower_result.scalar_one()
        follower.following_count += 1

        # Increment followers_count for following
        await self.session.execute(
            select(User).where(User.id == following_id).with_for_update()
        )
        following_result = await self.session.execute(
            select(User).where(User.id == following_id)
        )
        following = following_result.scalar_one()
        following.followers_count += 1

    async def decrement_follow_counts(self, follower_id: UUID, following_id: UUID):
        # Decrement following_count for follower
        await self.session.execute(
            select(User).where(User.id == follower_id).with_for_update()
        )
        follower_result = await self.session.execute(
            select(User).where(User.id == follower_id)
        )
        follower = follower_result.scalar_one()
        follower.following_count = max(0, follower.following_count - 1)

        # Decrement followers_count for following
        await self.session.execute(
            select(User).where(User.id == following_id).with_for_update()
        )
        following_result = await self.session.execute(
            select(User).where(User.id == following_id)
        )
        following = following_result.scalar_one()
        following.followers_count = max(0, following.followers_count - 1)