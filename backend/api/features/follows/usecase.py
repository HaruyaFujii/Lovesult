from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from api.features.users.schemas import UserResponse
from packages.services.follow_service import FollowService


class FollowUseCase:
    def __init__(self, session: AsyncSession):
        self.follow_service = FollowService(session)
        self.session = session

    async def follow_user(self, follower_id: UUID, following_id: UUID) -> bool:
        result = await self.follow_service.follow_user(follower_id, following_id)
        await self.session.commit()
        return result

    async def unfollow_user(self, follower_id: UUID, following_id: UUID) -> bool:
        result = await self.follow_service.unfollow_user(follower_id, following_id)
        await self.session.commit()
        return result

    async def get_follow_status(self, current_user_id: UUID, target_user_id: UUID) -> dict:
        return await self.follow_service.get_follow_status(current_user_id, target_user_id)

    async def get_followers(
        self, user_id: UUID, cursor: str | None = None, limit: int = 20
    ) -> tuple[list[UserResponse], str | None]:
        users, next_cursor = await self.follow_service.get_followers(user_id, cursor, limit)
        user_responses = [UserResponse.model_validate(user) for user in users]
        return user_responses, next_cursor

    async def get_following(
        self, user_id: UUID, cursor: str | None = None, limit: int = 20
    ) -> tuple[list[UserResponse], str | None]:
        users, next_cursor = await self.follow_service.get_following(user_id, cursor, limit)
        user_responses = [UserResponse.model_validate(user) for user in users]
        return user_responses, next_cursor
