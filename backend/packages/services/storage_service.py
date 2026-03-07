import os
from typing import Optional
from uuid import UUID
import httpx

from api.config.settings import get_settings


class StorageService:
    """Supabase Storage サービスクラス"""

    def __init__(self):
        settings = get_settings()
        # 正しいSupabase URLを使用
        self.supabase_url = settings.supabase_url
        # サービスロールキーを使用
        self.supabase_key = settings.supabase_service_role_key
        self.bucket_name = "avatars"

    async def ensure_bucket_exists(self):
        """avatarsバケットが存在することを確認し、なければ作成する"""
        async with httpx.AsyncClient(verify=False) as client:
            # まずバケットが存在するかチェック
            list_url = f"{self.supabase_url}/storage/v1/bucket"
            headers = {
                "Authorization": f"Bearer {self.supabase_key}",
                "Content-Type": "application/json",
            }

            # 既存バケット一覧を取得
            list_response = await client.get(list_url, headers=headers)

            if list_response.status_code == 200:
                buckets = list_response.json()
                bucket_names = [bucket.get("name", bucket.get("id", "")) for bucket in buckets]

                if self.bucket_name in bucket_names:
                    return

            # バケット作成API
            create_url = f"{self.supabase_url}/storage/v1/bucket"
            bucket_data = {
                "id": self.bucket_name,
                "name": self.bucket_name,
                "public": True,  # アバター画像は公開
                "file_size_limit": 5242880,  # 5MB
                "allowed_mime_types": ["image/jpeg", "image/png", "image/gif", "image/webp"]
            }

            response = await client.post(
                create_url,
                headers=headers,
                json=bucket_data
            )

    async def upload_avatar(
        self,
        user_id: UUID,
        file_data: bytes,
        content_type: str
    ) -> str:
        """アバター画像をアップロードしてURLを返す"""
        # バケットが存在することを確認
        await self.ensure_bucket_exists()
        # ファイル拡張子を決定
        ext = "jpg"
        if "png" in content_type:
            ext = "png"
        elif "gif" in content_type:
            ext = "gif"
        elif "webp" in content_type:
            ext = "webp"

        # ファイルパス（user_idを使用）
        file_path = f"{user_id}/avatar.{ext}"

        # Supabase Storage APIエンドポイント
        url = f"{self.supabase_url}/storage/v1/object/{self.bucket_name}/{file_path}"

        # HTTPヘッダー
        headers = {
            "Authorization": f"Bearer {self.supabase_key}",
            "Content-Type": content_type,
            "Cache-Control": "max-age=3600",
        }

        # SSL証明書検証を無効にしてHTTPクライアントを作成
        async with httpx.AsyncClient(verify=False) as client:
            # 先に既存ファイルを削除（あれば）
            try:
                await client.delete(
                    url,
                    headers={"Authorization": f"Bearer {self.supabase_key}"}
                )
            except Exception:
                pass

            # 新しいファイルをアップロード
            response = await client.post(
                url,
                headers=headers,
                content=file_data,
            )

            if response.status_code not in [200, 201]:
                raise ValueError(f"Failed to upload avatar: {response.status_code} - {response.text}")

            # 公開URLを返す
            public_url = f"{self.supabase_url}/storage/v1/object/public/{self.bucket_name}/{file_path}"

        return public_url

    async def delete_avatar(self, user_id: UUID) -> bool:
        """アバター画像を削除する"""
        # 削除するファイルパスのパターン（全拡張子）
        file_patterns = [
            f"{user_id}/avatar.jpg",
            f"{user_id}/avatar.png",
            f"{user_id}/avatar.gif",
            f"{user_id}/avatar.webp",
        ]

        # Supabase Storage APIエンドポイント
        url = f"{self.supabase_url}/storage/v1/object/{self.bucket_name}"

        # HTTPヘッダー
        headers = {
            "Authorization": f"Bearer {self.supabase_key}",
        }

        async with httpx.AsyncClient(verify=False) as client:
            for file_path in file_patterns:
                delete_url = f"{url}/{file_path}"
                response = await client.delete(
                    delete_url,
                    headers=headers,
                )
                # 204 No Content が成功レスポンス
                if response.status_code == 204:
                    return True

        return False