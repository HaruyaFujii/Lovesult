from datetime import datetime
from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy import and_, desc, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from packages.models.post import Post
from packages.models.user import User, UserStatus
from packages.models.follow import Follow


class PostRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, post_id: UUID) -> Optional[Post]:
        result = await self.session.execute(
            select(Post)
            .where(Post.id == post_id)
            .options(selectinload(Post.user))
        )
        return result.scalar_one_or_none()

    async def create(self, post: Post) -> Post:
        self.session.add(post)
        await self.session.flush()  # flush to get the ID, but don't commit
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
            select(Post).where(Post.id == post_id)
        )
        post = result.scalar_one_or_none()
        if not post:
            return False

        await self.session.delete(post)
        await self.session.flush()
        return True

    async def get_timeline(
        self,
        status_filter: Optional[UserStatus] = None,
        cursor: Optional[datetime] = None,
        limit: int = 20,
    ) -> Tuple[List[Post], Optional[str]]:
        query = select(Post).join(User).options(selectinload(Post.user))

        # カーソルベースのページネーション
        if cursor:
            query = query.where(Post.created_at < cursor)

        # ステータスフィルター（投稿時のステータスでフィルタリング）
        if status_filter:
            query = query.where(Post.author_status == status_filter)

        # 新着順でソート
        query = query.order_by(desc(Post.created_at)).limit(limit + 1)

        result = await self.session.execute(query)
        posts = list(result.scalars().all())

        # 次のカーソルを計算
        next_cursor = None
        if len(posts) > limit:
            posts = posts[:limit]
            next_cursor = posts[-1].created_at.isoformat()

        return posts, next_cursor

    async def get_mixed_timeline(
        self,
        user_status: UserStatus,
        cursor: Optional[datetime] = None,
        limit: int = 20,
    ) -> Tuple[List[Post], Optional[str]]:
        # 同じステータスの投稿を80%、他のステータスを20%の割合で取得
        same_status_limit = int(limit * 0.8)
        other_status_limit = limit - same_status_limit

        # 同じステータスの投稿を取得
        same_status_posts, _ = await self.get_timeline(
            status_filter=user_status,
            cursor=cursor,
            limit=same_status_limit,
        )

        # 他のステータスの投稿を取得
        query = select(Post).join(User).options(selectinload(Post.user))

        if cursor:
            query = query.where(Post.created_at < cursor)

        query = query.where(Post.author_status != user_status)
        query = query.order_by(desc(Post.created_at)).limit(other_status_limit)

        result = await self.session.execute(query)
        other_status_posts = list(result.scalars().all())

        # 投稿を結合して時系列順にソート
        all_posts = same_status_posts + other_status_posts
        all_posts.sort(key=lambda p: p.created_at, reverse=True)

        # 次のカーソルを計算
        next_cursor = None
        if all_posts:
            next_cursor = all_posts[-1].created_at.isoformat()

        return all_posts[:limit], next_cursor

    async def get_user_posts(
        self,
        user_id: UUID,
        cursor: Optional[datetime] = None,
        limit: int = 20,
    ) -> Tuple[List[Post], Optional[str]]:
        query = select(Post).where(Post.user_id == user_id).options(selectinload(Post.user))

        if cursor:
            query = query.where(Post.created_at < cursor)

        query = query.order_by(desc(Post.created_at)).limit(limit + 1)

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
        cursor: Optional[datetime] = None,
        limit: int = 20,
    ) -> Tuple[List[Post], Optional[str]]:
        # フォロー中のユーザーの投稿を取得
        query = (
            select(Post)
            .join(Follow, Follow.following_id == Post.user_id)
            .where(Follow.follower_id == user_id)
            .options(selectinload(Post.user))
        )

        # カーソルベースのページネーション
        if cursor:
            query = query.where(Post.created_at < cursor)

        # 新着順でソート
        query = query.order_by(desc(Post.created_at)).limit(limit + 1)

        result = await self.session.execute(query)
        posts = list(result.scalars().all())

        # 次のカーソルを計算
        next_cursor = None
        if len(posts) > limit:
            posts = posts[:limit]
            next_cursor = posts[-1].created_at.isoformat()

        return posts, next_cursor

    async def search_posts(
        self,
        query: Optional[str] = None,
        status_filter: Optional[UserStatus] = None,
        age_range_filter: Optional[str] = None,
        exclude_user_id: Optional[UUID] = None,
        cursor: Optional[datetime] = None,
        limit: int = 20,
    ) -> Tuple[List[Post], Optional[str]]:
        """
        投稿を検索する

        Args:
            query: 検索クエリ（投稿内容を検索）
            status_filter: ステータスフィルター
            age_range_filter: 年齢範囲フィルター
            exclude_user_id: 除外するユーザーID
            cursor: ページネーション用カーソル
            limit: 取得件数

        Returns:
            検索結果の投稿リストと次のカーソル
        """
        query_stmt = select(Post).options(selectinload(Post.user))

        # 検索条件を構築
        conditions = []

        # テキスト検索
        if query:
            conditions.append(Post.content.ilike(f"%{query}%"))

        # ステータスフィルター
        if status_filter:
            conditions.append(Post.author_status == status_filter)

        # 年齢範囲フィルター
        if age_range_filter:
            conditions.append(Post.author_age_range == age_range_filter)

        # ユーザーIDを除外
        if exclude_user_id:
            conditions.append(Post.user_id != exclude_user_id)

        # 条件を適用
        if conditions:
            query_stmt = query_stmt.where(and_(*conditions))

        # カーソルベースのページネーション
        if cursor:
            query_stmt = query_stmt.where(Post.created_at < cursor)

        # 新着順でソート
        query_stmt = query_stmt.order_by(desc(Post.created_at)).limit(limit + 1)

        result = await self.session.execute(query_stmt)
        posts = list(result.scalars().all())

        # 次のカーソルを計算
        next_cursor = None
        if len(posts) > limit:
            posts = posts[:limit]
            next_cursor = posts[-1].created_at.isoformat()

        return posts, next_cursor