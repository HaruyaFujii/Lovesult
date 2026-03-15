from datetime import datetime
from uuid import UUID

from sqlalchemy import and_, desc, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from packages.models.user import User, UserStatus


class UserRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, user_id: UUID) -> User | None:
        result = await self.session.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> User | None:
        result = await self.session.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    async def create(self, user: User) -> User:
        self.session.add(user)
        await self.session.flush()
        await self.session.refresh(user)
        return user

    async def update(self, user: User) -> User:
        self.session.add(user)
        await self.session.flush()
        await self.session.refresh(user)
        return user

    async def exists(self, user_id: UUID) -> bool:
        result = await self.session.execute(select(User).where(User.id == user_id).limit(1))
        return result.scalar_one_or_none() is not None

    async def search_users(
        self,
        query: str | None = None,
        status_filter: UserStatus | None = None,
        age_range_filter: str | None = None,
        exclude_user_id: UUID | None = None,
        cursor: datetime | None = None,
        limit: int = 20,
    ) -> tuple[list[User], str | None]:
        """
        ユーザーを検索する

        Args:
            query: 検索クエリ（ニックネームとbioを検索）
            status_filter: ステータスフィルター
            age_range_filter: 年齢範囲フィルター
            exclude_user_id: 除外するユーザーID
            cursor: ページネーション用カーソル
            limit: 取得件数

        Returns:
            検索結果のユーザーリストと次のカーソル
        """
        query_stmt = select(User)

        # 検索条件を構築
        conditions = []

        # テキスト検索（ニックネームとbioを検索）
        if query:
            text_conditions = []
            text_conditions.append(User.nickname.ilike(f"%{query}%"))
            text_conditions.append(User.bio.ilike(f"%{query}%"))
            if text_conditions:
                conditions.append(or_(*text_conditions))

        # ステータスフィルター
        if status_filter:
            conditions.append(User.status == status_filter)

        # 年齢範囲フィルター
        if age_range_filter:
            conditions.append(User.age_range == age_range_filter)

        # ユーザーIDを除外
        if exclude_user_id:
            conditions.append(User.id != exclude_user_id)

        # 条件を適用
        if conditions:
            query_stmt = query_stmt.where(and_(*conditions))

        # カーソルベースのページネーション
        if cursor:
            query_stmt = query_stmt.where(User.created_at < cursor)

        # 新着順でソート
        query_stmt = query_stmt.order_by(desc(User.created_at)).limit(limit + 1)

        result = await self.session.execute(query_stmt)
        users = list(result.scalars().all())

        # 次のカーソルを計算
        next_cursor = None
        if len(users) > limit:
            users = users[:limit]
            next_cursor = users[-1].created_at.isoformat()

        return users, next_cursor
