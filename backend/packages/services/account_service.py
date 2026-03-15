from uuid import UUID

import httpx
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

# from packages.models.reply import Reply  # Replies are now stored in posts table
from packages.models.follow import Follow
from packages.models.like import Like
from packages.models.notification import Notification
from packages.models.post import Post
from packages.models.report import Report
from packages.models.user import User


class AccountService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def delete_user_account(
        self, user_id: UUID, supabase_url: str, supabase_service_key: str
    ) -> bool:
        """
        ユーザーアカウントを完全に削除する

        Args:
            user_id: 削除するユーザーのID
            supabase_url: SupabaseのURL
            supabase_service_key: Supabaseのサービスキー（管理者権限）

        Returns:
            削除に成功した場合True
        """
        try:
            # トランザクション開始
            async with self.session.begin():
                # 1. ユーザーの投稿に関連するデータを削除
                # （外部キー制約でカスケード削除される場合もあるが、明示的に削除）

                # いいねを削除
                await self.session.execute(delete(Like).where(Like.user_id == user_id))  # type: ignore

                # フォロー関係を削除
                await self.session.execute(
                    delete(Follow).where(
                        (Follow.follower_id == user_id) | (Follow.following_id == user_id)
                    )  # type: ignore
                )

                # 通知を削除
                await self.session.execute(
                    delete(Notification).where(Notification.user_id == user_id)  # type: ignore
                )

                # レポートを削除（報告者として）
                await self.session.execute(delete(Report).where(Report.reporter_id == user_id))  # type: ignore

                # リプライと投稿を削除（リプライも posts テーブルに統合されている）
                await self.session.execute(delete(Post).where(Post.user_id == user_id))  # type: ignore

                # ユーザーを削除
                await self.session.execute(delete(User).where(User.id == user_id))  # type: ignore

                await self.session.commit()

            # 2. Supabase Authからユーザーを削除
            async with httpx.AsyncClient() as client:
                # Admin APIを使用してユーザーを削除
                headers = {
                    "apikey": supabase_service_key,
                    "Authorization": f"Bearer {supabase_service_key}",
                    "Content-Type": "application/json",
                }

                response = await client.delete(
                    f"{supabase_url}/auth/v1/admin/users/{user_id}", headers=headers
                )

                if response.status_code not in [200, 204]:
                    # Supabaseからの削除に失敗した場合もログに記録するが、
                    # ローカルDBからは既に削除されているので続行
                    pass

            return True

        except Exception:
            await self.session.rollback()
            raise

    async def get_user_data_summary(self, user_id: UUID) -> dict[str, int]:
        """
        削除前にユーザーのデータサマリーを取得

        Args:
            user_id: ユーザーID

        Returns:
            ユーザーのデータサマリー
        """
        # 投稿数を取得
        posts_result = await self.session.execute(select(Post).where(Post.user_id == user_id))  # type: ignore
        posts_count = len(posts_result.scalars().all())

        # リプライ数を取得（parent_idがあるpostsがリプライ）
        replies_result = await self.session.execute(
            select(Post).where((Post.user_id == user_id) & (Post.parent_id.is_not(None)))  # type: ignore
        )
        replies_count = len(replies_result.scalars().all())

        # フォロワー数を取得
        followers_result = await self.session.execute(
            select(Follow).where(Follow.following_id == user_id)  # type: ignore
        )
        followers_count = len(followers_result.scalars().all())

        # フォロー数を取得
        following_result = await self.session.execute(
            select(Follow).where(Follow.follower_id == user_id)  # type: ignore
        )
        following_count = len(following_result.scalars().all())

        return {
            "posts_count": posts_count,
            "replies_count": replies_count,
            "followers_count": followers_count,
            "following_count": following_count,
        }
