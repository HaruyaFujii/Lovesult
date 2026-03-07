from pydantic import BaseModel


class AccountDeletionRequest(BaseModel):
    """アカウント削除リクエスト"""
    confirmation: str  # "DELETE MY ACCOUNT" という文字列を要求


class AccountDeletionResponse(BaseModel):
    """アカウント削除レスポンス"""
    success: bool
    message: str