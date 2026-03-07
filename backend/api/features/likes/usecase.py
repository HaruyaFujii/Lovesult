from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from packages.services.like_service import LikeService


class LikeUseCase:
    def __init__(self, session: AsyncSession):
        self.like_service = LikeService(session)
        self.session = session

    async def like_post(self, user_id: UUID, post_id: UUID) -> bool:
        result = await self.like_service.like_post(user_id, post_id)
        await self.session.commit()
        return result

    async def unlike_post(self, user_id: UUID, post_id: UUID) -> bool:
        result = await self.like_service.unlike_post(user_id, post_id)
        await self.session.commit()
        return result