from uuid import UUID
import httpx

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import delete, select

from packages.models.user import User
from packages.models.post import Post
from packages.models.reply import Reply
from packages.models.follow import Follow
from packages.models.like import Like
from packages.models.bookmark import Bookmark
from packages.models.notification import Notification
from packages.models.report import Report


class AccountService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def delete_user_account(self, user_id: UUID, supabase_url: str, supabase_service_key: str) -> bool:
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
                await self.session.execute(
                    delete(Like).where(Like.user_id == user_id)
                )

                # ブックマークを削除
                await self.session.execute(
                    delete(Bookmark).where(Bookmark.user_id == user_id)
                )

                # フォロー関係を削除
                await self.session.execute(
                    delete(Follow).where(
                        (Follow.follower_id == user_id) | (Follow.following_id == user_id)
                    )
                )

                # 通知を削除
                await self.session.execute(
                    delete(Notification).where(
                        (Notification.user_id == user_id) | (Notification.actor_id == user_id)
                    )
                )

                # レポートを削除（報告者として）
                await self.session.execute(
                    delete(Report).where(Report.reporter_id == user_id)
                )

                # リプライを削除
                await self.session.execute(
                    delete(Reply).where(Reply.user_id == user_id)
                )

                # 投稿を削除
                await self.session.execute(
                    delete(Post).where(Post.user_id == user_id)
                )

                # ユーザーを削除
                await self.session.execute(
                    delete(User).where(User.id == user_id)
                )

                await self.session.commit()

            # 2. Supabase Authからユーザーを削除
            async with httpx.AsyncClient() as client:
                # Admin APIを使用してユーザーを削除
                headers = {
                    "apikey": supabase_service_key,
                    "Authorization": f"Bearer {supabase_service_key}",
                    "Content-Type": "application/json"
                }

                response = await client.delete(
                    f"{supabase_url}/auth/v1/admin/users/{user_id}",
                    headers=headers
                )

                if response.status_code not in [200, 204]:
                    # Supabaseからの削除に失敗した場合もログに記録するが、
                    # ローカルDBからは既に削除されているので続行
                    print(f"Failed to delete user from Supabase Auth: {response.text}")

            return True

        except Exception as e:
            print(f"Error deleting user account: {e}")
            await self.session.rollback()
            raise

    async def get_user_data_summary(self, user_id: UUID) -> dict:
        """
        削除前にユーザーのデータサマリーを取得

        Args:
            user_id: ユーザーID

        Returns:
            ユーザーのデータサマリー
        """
        # 投稿数を取得
        posts_result = await self.session.execute(
            select(Post).where(Post.user_id == user_id)
        )
        posts_count = len(posts_result.scalars().all())

        # リプライ数を取得
        replies_result = await self.session.execute(
            select(Reply).where(Reply.user_id == user_id)
        )
        replies_count = len(replies_result.scalars().all())

        # フォロワー数を取得
        followers_result = await self.session.execute(
            select(Follow).where(Follow.following_id == user_id)
        )
        followers_count = len(followers_result.scalars().all())

        # フォロー数を取得
        following_result = await self.session.execute(
            select(Follow).where(Follow.follower_id == user_id)
        )
        following_count = len(following_result.scalars().all())

        return {
            "posts_count": posts_count,
            "replies_count": replies_count,
            "followers_count": followers_count,
            "following_count": following_count
        }