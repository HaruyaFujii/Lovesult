from typing import List, Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from packages.models.reply import Reply
from packages.models.post import Post
from packages.repositories.reply_repository import ReplyRepository
from packages.repositories.post_repository import PostRepository
from packages.services.notification_service import NotificationService


class ReplyService:
    def __init__(self, session: AsyncSession):
        self.repository = ReplyRepository(session)
        self.post_repository = PostRepository(session)
        self.notification_service = NotificationService(session)

    async def create_reply(
        self, post_id: UUID, user_id: UUID, content: str
    ) -> Reply:
        # 投稿の所有者を取得
        post = await self.post_repository.get_by_id(post_id)
        if not post:
            raise ValueError("Post not found")

        reply = Reply(post_id=post_id, user_id=user_id, content=content)
        created_reply = await self.repository.create(reply)
        await self.repository.session.commit()

        # ユーザー情報を含めて再取得
        result = await self.repository.session.execute(
            select(Reply)
            .where(Reply.id == created_reply.id)
            .options(selectinload(Reply.user))
        )
        created_reply_with_user = result.scalar_one()

        # リプライ通知を作成（自分の投稿にリプライした場合は通知しない）
        if post.user_id != user_id:
            await self.notification_service.create_reply_notification(
                post_id=post_id,
                post_author_id=post.user_id,  # 投稿の所有者
                reply_id=created_reply.id,
                replier_id=user_id      # リプライした人
            )

        return created_reply_with_user

    async def get_replies(self, post_id: UUID) -> List[Reply]:
        return await self.repository.get_by_post_id(post_id)

    async def delete_reply(self, reply_id: UUID, user_id: UUID) -> bool:
        reply = await self.repository.get_by_id(reply_id)
        if not reply or reply.user_id != user_id:
            return False

        result = await self.repository.delete(reply_id)
        await self.repository.session.commit()
        return result