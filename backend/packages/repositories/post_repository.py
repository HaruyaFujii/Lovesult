from collections.abc import Sequence
from datetime import datetime
from uuid import UUID

from sqlalchemy import and_, desc, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from packages.models.follow import Follow
from packages.models.post import Post
from packages.models.user import User, UserStatus


class PostRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_by_id(self, post_id: UUID) -> Post | None:
        result = await self.session.execute(
            select(Post)
            .where(Post.id == post_id)  # type: ignore[arg-type]
            .options(selectinload(Post.user))
        )
        return result.scalar_one_or_none()

    async def create(self, post: Post) -> Post:
        self.session.add(post)
        await self.session.flush()
        await self.session.refresh(post)
        return post

    async def update(self, post: Post) -> Post:
        post.updated_at = datetime.utcnow()
        self.session.add(post)
        await self.session.flush()
        await self.session.refresh(post)
        return post

    async def delete(self, post_id: UUID) -> bool:
        result = await self.session.execute(
            select(Post).where(Post.id == post_id)  # type: ignore[arg-type]
        )
        post = result.scalar_one_or_none()
        if not post:
            return False

        await self.session.delete(post)
        await self.session.flush()
        return True

    async def get_timeline(
        self,
        status_filter: UserStatus | None = None,
        cursor: datetime | None = None,
        limit: int = 20,
    ) -> tuple[Sequence[Post], str | None]:
        query = (
            select(Post)
            .options(selectinload(Post.user))
            .where(Post.parent_id.is_(None))  # type: ignore[arg-type]
        )

        if cursor:
            cursor_time = cursor if isinstance(cursor, datetime) else datetime.fromisoformat(cursor)
            query = query.where(Post.created_at < cursor_time)  # type: ignore[arg-type]

        if status_filter:
            query = query.where(Post.author_status == status_filter)  # type: ignore[arg-type]

        query = query.order_by(desc(Post.created_at)).limit(limit + 1)  # type: ignore[arg-type]

        result = await self.session.execute(query)
        posts = list(result.scalars().all())

        next_cursor = None
        if len(posts) > limit:
            posts = posts[:limit]
            next_cursor = posts[-1].created_at.isoformat()

        return posts, next_cursor

    async def get_mixed_timeline(
        self,
        user_status: UserStatus,
        cursor: datetime | None = None,
        limit: int = 20,
    ) -> tuple[Sequence[Post], str | None]:
        same_status_limit = int(limit * 0.8)
        other_status_limit = limit - same_status_limit

        same_status_posts, _ = await self.get_timeline(
            status_filter=user_status,
            cursor=cursor,
            limit=same_status_limit,
        )

        query = (
            select(Post)
            .options(selectinload(Post.user))
            .where(
                and_(
                    Post.parent_id.is_(None),  # type: ignore[arg-type]
                    Post.author_status != user_status,  # type: ignore[arg-type]
                )
            )
        )

        if cursor:
            cursor_time = cursor if isinstance(cursor, datetime) else datetime.fromisoformat(cursor)
            query = query.where(Post.created_at < cursor_time)  # type: ignore[arg-type]

        query = query.order_by(desc(Post.created_at)).limit(other_status_limit + 1)  # type: ignore[arg-type]
        result = await self.session.execute(query)
        other_status_posts = list(result.scalars().all())

        all_posts = list(same_status_posts) + list(other_status_posts)
        all_posts.sort(key=lambda p: p.created_at, reverse=True)

        next_cursor = None
        if all_posts:
            next_cursor = all_posts[-1].created_at.isoformat()

        return all_posts[:limit], next_cursor

    async def get_user_posts(
        self,
        user_id: UUID,
        cursor: datetime | None = None,
        limit: int = 20,
    ) -> tuple[Sequence[Post], str | None]:
        query = (
            select(Post)
            .options(selectinload(Post.user))
            .where(
                and_(
                    Post.user_id == user_id,  # type: ignore[arg-type]
                    Post.parent_id.is_(None),  # type: ignore[arg-type]
                )
            )
        )

        if cursor:
            cursor_time = cursor if isinstance(cursor, datetime) else datetime.fromisoformat(cursor)
            query = query.where(Post.created_at < cursor_time)  # type: ignore[arg-type]

        query = query.order_by(desc(Post.created_at)).limit(limit + 1)  # type: ignore[arg-type]
        result = await self.session.execute(query)
        posts = list(result.scalars().all())

        next_cursor = None
        if len(posts) > limit:
            posts = posts[:limit]
            next_cursor = posts[-1].created_at.isoformat()

        return posts, next_cursor

    async def get_following_timeline(
        self,
        user_id: UUID,
        cursor: datetime | None = None,
        limit: int = 20,
    ) -> tuple[Sequence[Post], str | None]:
        query = (
            select(Post)
            .options(selectinload(Post.user))
            .join(Follow, Follow.following_id == Post.user_id)  # type: ignore[arg-type]
            .where(
                and_(
                    Follow.follower_id == user_id,  # type: ignore[arg-type]
                    Post.parent_id.is_(None),  # type: ignore[arg-type]
                )
            )
        )

        if cursor:
            cursor_time = cursor if isinstance(cursor, datetime) else datetime.fromisoformat(cursor)
            query = query.where(Post.created_at < cursor_time)  # type: ignore[arg-type]

        query = query.order_by(desc(Post.created_at)).limit(limit + 1)  # type: ignore[arg-type]
        result = await self.session.execute(query)
        posts = list(result.scalars().all())

        next_cursor = None
        if len(posts) > limit:
            posts = posts[:limit]
            next_cursor = posts[-1].created_at.isoformat()

        return posts, next_cursor

    async def search_posts(
        self,
        query: str | None = None,
        status_filter: UserStatus | None = None,
        age_range_filter: str | None = None,
        exclude_user_id: UUID | None = None,
        cursor: datetime | None = None,
        limit: int = 20,
    ) -> tuple[Sequence[Post], str | None]:
        conditions = []

        conditions.append(Post.parent_id.is_(None))  # type: ignore[arg-type]

        if query:
            conditions.append(Post.content.contains(query))  # type: ignore[arg-type]

        if status_filter:
            conditions.append(Post.author_status == status_filter)  # type: ignore[arg-type]

        if age_range_filter:
            conditions.append(Post.author_age_range == age_range_filter)  # type: ignore[arg-type]

        if exclude_user_id:
            conditions.append(Post.user_id != exclude_user_id)  # type: ignore[arg-type]

        search_query = select(Post).options(selectinload(Post.user))
        if conditions:
            search_query = search_query.where(and_(*conditions))

        if cursor:
            cursor_time = cursor if isinstance(cursor, datetime) else datetime.fromisoformat(cursor)
            search_query = search_query.where(Post.created_at < cursor_time)  # type: ignore[arg-type]

        search_query = search_query.order_by(desc(Post.created_at)).limit(limit + 1)  # type: ignore[arg-type]
        result = await self.session.execute(search_query)
        posts = list(result.scalars().all())

        next_cursor = None
        if len(posts) > limit:
            posts = posts[:limit]
            next_cursor = posts[-1].created_at.isoformat()

        return posts, next_cursor