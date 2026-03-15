from typing import Any, Dict, List, Optional, Set
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from packages.models.reply import Reply
from packages.models.reply_like import ReplyLike
from packages.models.post import Post
from packages.repositories.reply_repository import ReplyRepository
from packages.repositories.post_repository import PostRepository
from packages.services.notification_service import NotificationService


class ReplyService:
    def __init__(self, session: AsyncSession):
        self.repository = ReplyRepository(session)
        self.post_repository = PostRepository(session)
        self.notification_service = NotificationService(session)
        self.session = session

    async def create_reply(
        self,
        post_id: UUID,
        user_id: UUID,
        content: str,
        parent_id: Optional[UUID] = None,
    ) -> Reply:
        # 投稿の所有者を取得
        post = await self.post_repository.get_by_id(post_id)
        if not post:
            raise ValueError("Post not found")

        reply = Reply(
            post_id=post_id, user_id=user_id, content=content, parent_id=parent_id
        )
        created_reply = await self.repository.create(reply)

        # 親リプライのreplies_countを更新
        if parent_id:
            parent_result = await self.session.execute(
                select(Reply).where(Reply.id == parent_id)
            )
            parent_reply = parent_result.scalar_one_or_none()
            if parent_reply:
                parent_reply.replies_count = (parent_reply.replies_count or 0) + 1

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
                replier_id=user_id,  # リプライした人
            )

        return created_reply_with_user

    async def get_replies(
        self, post_id: UUID, current_user_id: Optional[UUID] = None
    ) -> List[Dict[str, Any]]:
        """リプライを取得（第1階層のみ、ネストされたリプライは含まない）"""
        # すべてのリプライを取得
        replies = await self.repository.get_by_post_id(post_id)

        # ユーザーがいいねしているリプライIDを取得
        liked_reply_ids: Set[UUID] = set()
        if current_user_id:
            reply_ids = [r.id for r in replies]
            if reply_ids:
                result = await self.session.execute(
                    select(ReplyLike.reply_id).where(
                        ReplyLike.user_id == current_user_id,
                        ReplyLike.reply_id.in_(reply_ids),
                    )
                )
                liked_reply_ids = set(row[0] for row in result.fetchall())

        # リプライをDictに変換（第1階層のみ返す）
        root_replies: List[Dict[str, Any]] = []
        for reply in replies:
            # 親リプライがない（投稿への直接のリプライ）場合のみ追加
            if reply.parent_id is None:
                reply_dict = {
                    "id": reply.id,
                    "post_id": reply.post_id,
                    "user_id": reply.user_id,
                    "content": reply.content,
                    "created_at": reply.created_at,
                    "user": reply.user,
                    "parent_id": reply.parent_id,
                    "likes_count": reply.likes_count or 0,
                    "replies_count": reply.replies_count or 0,
                    "is_liked": reply.id in liked_reply_ids,
                    "has_replies": reply.replies_count > 0,  # ネストされたリプライがあるかどうか
                    "replies": [],  # 初期状態では空配列
                }
                root_replies.append(reply_dict)

        # 作成日時でソート
        root_replies.sort(key=lambda x: x["created_at"])

        return root_replies

    async def get_nested_replies(
        self, parent_reply_id: UUID, current_user_id: Optional[UUID] = None
    ) -> List[Dict[str, Any]]:
        """特定のリプライへのネストされたリプライを取得"""
        # 親リプライのIDを指定してリプライを取得
        replies = await self.repository.get_by_parent_id(parent_reply_id)

        # ユーザーがいいねしているリプライIDを取得
        liked_reply_ids: Set[UUID] = set()
        if current_user_id:
            reply_ids = [r.id for r in replies]
            if reply_ids:
                result = await self.session.execute(
                    select(ReplyLike.reply_id).where(
                        ReplyLike.user_id == current_user_id,
                        ReplyLike.reply_id.in_(reply_ids),
                    )
                )
                liked_reply_ids = set(row[0] for row in result.fetchall())

        # リプライをDictに変換
        nested_replies: List[Dict[str, Any]] = []
        for reply in replies:
            reply_dict = {
                "id": reply.id,
                "post_id": reply.post_id,
                "user_id": reply.user_id,
                "content": reply.content,
                "created_at": reply.created_at,
                "user": reply.user,
                "parent_id": reply.parent_id,
                "likes_count": reply.likes_count or 0,
                "replies_count": reply.replies_count or 0,
                "is_liked": reply.id in liked_reply_ids,
                "has_replies": reply.replies_count > 0,
                "replies": [],
            }
            nested_replies.append(reply_dict)

        # 作成日時でソート
        nested_replies.sort(key=lambda x: x["created_at"])

        return nested_replies

    async def get_reply(
        self, reply_id: UUID, current_user_id: Optional[UUID] = None
    ) -> Optional[Any]:
        """単一のリプライを取得"""
        # リプライ本体を取得
        result = await self.session.execute(
            select(Reply)
            .where(Reply.id == reply_id)
            .options(selectinload(Reply.user))
        )
        reply = result.scalar_one_or_none()

        if not reply:
            return None

        # ユーザーがいいねしているか確認
        is_liked = False
        if current_user_id:
            like_result = await self.session.execute(
                select(ReplyLike).where(
                    ReplyLike.user_id == current_user_id,
                    ReplyLike.reply_id == reply_id,
                )
            )
            is_liked = like_result.scalar_one_or_none() is not None

        # リプライ情報を構築
        reply_dict = {
            "id": reply.id,
            "post_id": reply.post_id,
            "user_id": reply.user_id,
            "content": reply.content,
            "created_at": reply.created_at,
            "user": {
                "id": reply.user.id,
                "email": reply.user.email,
                "nickname": reply.user.nickname,
                "avatar_url": reply.user.avatar_url,
                "bio": reply.user.bio,
                "status": reply.user.status,
                "gender": reply.user.gender,
                "age_range": reply.user.age_range,
                "created_at": reply.user.created_at,
                "updated_at": reply.user.updated_at,
            },
            "parent_id": reply.parent_id,
            "likes_count": reply.likes_count or 0,
            "replies_count": reply.replies_count or 0,
            "is_liked": is_liked,
            "has_replies": (reply.replies_count or 0) > 0,
        }

        # AttributeErrorを避けるためにSimpleNamespaceを使って返す
        from types import SimpleNamespace
        return SimpleNamespace(**reply_dict)

    async def delete_reply(self, reply_id: UUID, user_id: UUID) -> bool:
        reply = await self.repository.get_by_id(reply_id)
        if not reply or reply.user_id != user_id:
            return False

        result = await self.repository.delete(reply_id)
        await self.repository.session.commit()
        return result
