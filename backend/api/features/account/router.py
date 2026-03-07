from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from api.core.dependencies import get_current_user_id, get_db
from .schemas import AccountDeletionRequest, AccountDeletionResponse
from .usecase import AccountUseCase

router = APIRouter(prefix="/api/v1", tags=["account"])


@router.delete("/account", response_model=AccountDeletionResponse)
async def delete_account(
    request: AccountDeletionRequest,
    current_user_id: UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
) -> AccountDeletionResponse:
    """
    アカウントを削除する

    確認のため、confirmationフィールドに「DELETE MY ACCOUNT」という文字列を送信する必要があります。
    この操作は取り消すことができません。
    """
    usecase = AccountUseCase(db)
    return await usecase.delete_account(current_user_id, request.confirmation)


@router.get("/account/summary")
async def get_account_summary(
    current_user_id: UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
) -> dict:
    """
    アカウントのデータサマリーを取得する

    削除前の確認用に、ユーザーのデータ件数を返します。
    """
    usecase = AccountUseCase(db)
    return await usecase.get_account_summary(current_user_id)