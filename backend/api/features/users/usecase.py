from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from packages.services.storage_service import StorageService
from packages.services.user_service import UserService

from .schemas import UserUpdate


class UserUseCase:
    def __init__(self, session: AsyncSession):
        self.service = UserService(session)
        self.storage_service = StorageService()

    async def get_user(self, user_id: UUID):
        user = await self.service.get_user(user_id)
        if not user:
            raise ValueError("User not found")

        # 投稿数を取得してレスポンスに追加
        post_count = await self.service.get_user_post_count(user_id)

        # 辞書形式で返して投稿数を追加
        user_dict = {
            "id": user.id,
            "email": user.email,
            "nickname": user.nickname,
            "status": user.status,
            "gender": user.gender,
            "age_range": user.age_range,
            "bio": user.bio,
            "avatar_url": user.avatar_url,
            "followers_count": user.followers_count,
            "following_count": user.following_count,
            "posts_count": post_count,
            "created_at": user.created_at,
            "updated_at": user.updated_at,
        }

        return user_dict

    async def get_or_create_user(self, user_id: UUID, email: str):
        return await self.service.get_or_create_user(user_id, email)

    async def update_user(self, user_id: UUID, user_data: UserUpdate):
        user = await self.service.update_user(user_id, user_data)
        if not user:
            raise ValueError("User not found")

        # 投稿数を取得してレスポンスに追加
        post_count = await self.service.get_user_post_count(user_id)

        # 辞書形式で返して投稿数を追加
        user_dict = {
            "id": user.id,
            "email": user.email,
            "nickname": user.nickname,
            "status": user.status,
            "gender": user.gender,
            "age_range": user.age_range,
            "bio": user.bio,
            "avatar_url": user.avatar_url,
            "followers_count": user.followers_count,
            "following_count": user.following_count,
            "posts_count": post_count,
            "created_at": user.created_at,
            "updated_at": user.updated_at,
        }

        return user_dict

    async def get_all_users(self, limit: int = 50, cursor: str | None = None):
        """全ユーザーを取得"""
        users = await self.service.get_all_users(limit=limit, cursor=cursor)

        result = []
        for user in users:
            user_dict = {
                "id": user.id,
                "email": user.email,
                "nickname": user.nickname,
                "status": user.status,
                "gender": user.gender,
                "age_range": user.age_range,
                "bio": user.bio,
                "avatar_url": user.avatar_url,
                "followers_count": user.followers_count,
                "following_count": user.following_count,
                "created_at": user.created_at,
                "updated_at": user.updated_at,
            }
            result.append(user_dict)

        return result

    async def upload_avatar(self, user_id: UUID, file_data: bytes, content_type: str):
        """アバター画像をアップロードしてプロフィールを更新"""
        # Supabase Storageにアップロード
        avatar_url = await self.storage_service.upload_avatar(
            user_id=user_id, file_data=file_data, content_type=content_type
        )

        # ユーザープロフィールのアバターURLを更新
        user_update = UserUpdate(avatar_url=avatar_url)
        user = await self.service.update_user(user_id, user_update)

        if not user:
            raise ValueError("User not found")

        # 投稿数を取得してレスポンスに追加
        post_count = await self.service.get_user_post_count(user_id)

        # 辞書形式で返して投稿数を追加
        user_dict = {
            "id": user.id,
            "email": user.email,
            "nickname": user.nickname,
            "status": user.status,
            "gender": user.gender,
            "age_range": user.age_range,
            "bio": user.bio,
            "avatar_url": user.avatar_url,
            "followers_count": user.followers_count,
            "following_count": user.following_count,
            "posts_count": post_count,
            "created_at": user.created_at,
            "updated_at": user.updated_at,
        }

        return user_dict
