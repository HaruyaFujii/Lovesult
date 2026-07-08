from uuid import UUID

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from packages.models.follow import Follow
from packages.models.user import User


class FollowRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create_follow(self, follower_id: UUID, following_id: UUID) -> Follow:
        follow = Follow(follower_id=follower_id, following_id=following_id)
        self.session.add(follow)
        await self.session.flush()
        return follow

    async def delete_follow(self, follower_id: UUID, following_id: UUID) -> bool:
        result = await self.session.execute(
            select(Follow).where(
                and_(Follow.follower_id == follower_id, Follow.following_id == following_id)
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
                and_(Follow.follower_id == follower_id, Follow.following_id == following_id)
            )
        )
        count = result.scalar()
        return count > 0

    async def get_followers(
        self, user_id: UUID, cursor: str | None = None, limit: int = 20
    ) -> tuple[list[User], str | None]:
        # User と Follow を join して1クエリで取得する。
        # 次カーソル用に Follow.created_at も同時に取得しておく。
        query = (
            select(User, Follow.created_at)
            .join(Follow, Follow.follower_id == User.id)
            .where(Follow.following_id == user_id)
            .order_by(Follow.created_at.desc(), User.id)
        )

        if cursor:
            # cursor is created_at timestamp + user_id
            cursor_parts = cursor.split("_")
            if len(cursor_parts) == 2:
                cursor_timestamp = cursor_parts[0]
                cursor_user_id = cursor_parts[1]
                query = query.where(Follow.created_at < cursor_timestamp, User.id < cursor_user_id)

        query = query.limit(limit + 1)
        result = await self.session.execute(query)
        rows = result.all()

        next_cursor = None
        if len(rows) > limit:
            rows = rows[:-1]
            if rows:
                last_user, last_created_at = rows[-1]
                next_cursor = f"{last_created_at.isoformat()}_{last_user.id}"

        users = [row[0] for row in rows]
        return users, next_cursor

    async def get_following(
        self, user_id: UUID, cursor: str | None = None, limit: int = 20
    ) -> tuple[list[User], str | None]:
        query = (
            select(User, Follow.created_at)
            .join(Follow, Follow.following_id == User.id)
            .where(Follow.follower_id == user_id)
            .order_by(Follow.created_at.desc(), User.id)
        )

        if cursor:
            cursor_parts = cursor.split("_")
            if len(cursor_parts) == 2:
                cursor_timestamp = cursor_parts[0]
                cursor_user_id = cursor_parts[1]
                query = query.where(Follow.created_at < cursor_timestamp, User.id < cursor_user_id)

        query = query.limit(limit + 1)
        result = await self.session.execute(query)
        rows = result.all()

        next_cursor = None
        if len(rows) > limit:
            rows = rows[:-1]
            if rows:
                last_user, last_created_at = rows[-1]
                next_cursor = f"{last_created_at.isoformat()}_{last_user.id}"

        users = [row[0] for row in rows]
        return users, next_cursor

    async def increment_follow_counts(self, follower_id: UUID, following_id: UUID) -> None:
        # Increment following_count for follower
        follower_result = await self.session.execute(select(User).where(User.id == follower_id))
        follower = follower_result.scalar_one()
        follower.following_count += 1

        # Increment followers_count for following
        following_result = await self.session.execute(select(User).where(User.id == following_id))
        following = following_result.scalar_one()
        following.followers_count += 1

    async def decrement_follow_counts(self, follower_id: UUID, following_id: UUID) -> None:
        # Decrement following_count for follower
        follower_result = await self.session.execute(select(User).where(User.id == follower_id))
        follower = follower_result.scalar_one()
        follower.following_count = max(0, follower.following_count - 1)

        # Decrement followers_count for following
        following_result = await self.session.execute(select(User).where(User.id == following_id))
        following = following_result.scalar_one()
        following.followers_count = max(0, following.followers_count - 1)
