from typing import Optional, List
from uuid import UUID
from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from packages.models.user import User, UserBase, UserStatus, AgeRange
from packages.models.post import Post
from packages.repositories.user_repository import UserRepository


class UserService:
    def __init__(self, session: AsyncSession):
        self.repository = UserRepository(session)

    async def get_user(self, user_id: UUID) -> Optional[User]:
        return await self.repository.get_by_id(user_id)

    async def get_or_create_user(self, user_id: UUID, email: str) -> User:
        user = await self.repository.get_by_id(user_id)
        if user:
            return user

        # 新規ユーザー作成（初期値設定）
        new_user = User(
            id=user_id,
            email=email,
            nickname="User",
            status=UserStatus.SEEKING,
            age_range=AgeRange.TWENTIES,
        )
        created_user = await self.repository.create(new_user)
        await self.repository.session.commit()
        return created_user

    async def update_user(self, user_id: UUID, user_data) -> Optional[User]:
        user = await self.repository.get_by_id(user_id)
        if not user:
            return None

        # Noneでないフィールドのみ更新
        if user_data.nickname is not None:
            user.nickname = user_data.nickname
        if user_data.status is not None:
            user.status = user_data.status
        if user_data.gender is not None:
            user.gender = user_data.gender
        if user_data.age_range is not None:
            user.age_range = user_data.age_range
        if user_data.bio is not None:
            user.bio = user_data.bio
        if hasattr(user_data, 'avatar_url') and user_data.avatar_url is not None:
            user.avatar_url = user_data.avatar_url

        updated_user = await self.repository.update(user)
        await self.repository.session.commit()
        return updated_user

    async def get_user_post_count(self, user_id: UUID) -> int:
        """ユーザーの投稿数を取得"""
        stmt = select(func.count(Post.id)).where(Post.user_id == user_id)
        result = await self.repository.session.execute(stmt)
        return result.scalar() or 0

    async def get_all_users(self, limit: int = 50, cursor: Optional[str] = None) -> List[User]:
        """全ユーザーを取得"""
        query = select(User).order_by(User.created_at.desc())

        if cursor:
            cursor_time = datetime.fromisoformat(cursor)
            query = query.where(User.created_at < cursor_time)

        query = query.limit(limit)

        result = await self.repository.session.execute(query)
        users = result.scalars().all()

        return users