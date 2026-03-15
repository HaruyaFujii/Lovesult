from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from api.config import get_settings
from packages.services.account_service import AccountService

from .schemas import AccountDeletionResponse


class AccountUseCase:
    def __init__(self, session: AsyncSession):
        self.account_service = AccountService(session)
        self.settings = get_settings()

    async def delete_account(self, user_id: UUID, confirmation: str) -> AccountDeletionResponse:
        """
        アカウントを削除する

        Args:
            user_id: 削除するユーザーのID
            confirmation: 確認文字列

        Returns:
            削除結果
        """
        # 確認文字列をチェック
        if confirmation != "DELETE MY ACCOUNT":
            return AccountDeletionResponse(
                success=False,
                message="確認文字列が正しくありません。'DELETE MY ACCOUNT'と入力してください。",
            )

        try:
            # アカウントを削除
            success = await self.account_service.delete_user_account(
                user_id=user_id,
                supabase_url=self.settings.supabase_url,
                supabase_service_key=self.settings.supabase_service_role_key,
            )

            if success:
                return AccountDeletionResponse(
                    success=True, message="アカウントが正常に削除されました。"
                )
            else:
                return AccountDeletionResponse(
                    success=False, message="アカウントの削除に失敗しました。"
                )

        except Exception:
            return AccountDeletionResponse(
                success=False, message="アカウントの削除中にエラーが発生しました。"
            )

    async def get_account_summary(self, user_id: UUID) -> dict:
        """
        アカウントのデータサマリーを取得

        Args:
            user_id: ユーザーID

        Returns:
            データサマリー
        """
        return await self.account_service.get_user_data_summary(user_id)
