from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from packages.models.user import User
from packages.repositories.follow_repository import FollowRepository
from packages.services.notification_service import NotificationService


class FollowService:
    def __init__(self, session: AsyncSession):
        self.repository = FollowRepository(session)
        self.session = session

    async def follow_user(self, follower_id: UUID, following_id: UUID) -> bool:
        # 自分自身をフォローすることはできない
        if follower_id == following_id:
            raise ValueError("Cannot follow yourself")

        # すでにフォローしているかチェック
        is_already_following = await self.repository.is_following(follower_id, following_id)
        if is_already_following:
            return False

        # フォロー関係を作成
        await self.repository.create_follow(follower_id, following_id)

        # カウント更新
        await self.repository.increment_follow_counts(follower_id, following_id)

        # 通知を作成
        notification_service = NotificationService(self.session)
        await notification_service.create_follow_notification(following_id, follower_id)

        return True

    async def unfollow_user(self, follower_id: UUID, following_id: UUID) -> bool:
        # フォロー関係を削除
        is_deleted = await self.repository.delete_follow(follower_id, following_id)

        if is_deleted:
            # カウント更新
            await self.repository.decrement_follow_counts(follower_id, following_id)

        return is_deleted

    async def is_following(self, follower_id: UUID, following_id: UUID) -> bool:
        return await self.repository.is_following(follower_id, following_id)

    async def get_followers(
        self,
        user_id: UUID,
        cursor: Optional[str] = None,
        limit: int = 20
    ) -> Tuple[List[User], Optional[str]]:
        return await self.repository.get_followers(user_id, cursor, limit)

    async def get_following(
        self,
        user_id: UUID,
        cursor: Optional[str] = None,
        limit: int = 20
    ) -> Tuple[List[User], Optional[str]]:
        return await self.repository.get_following(user_id, cursor, limit)

    async def get_follow_status(self, current_user_id: UUID, target_user_id: UUID) -> dict:
        is_following = await self.is_following(current_user_id, target_user_id)
        is_followed_by = await self.is_following(target_user_id, current_user_id)

        return {
            "is_following": is_following,
            "is_followed_by": is_followed_by
        }