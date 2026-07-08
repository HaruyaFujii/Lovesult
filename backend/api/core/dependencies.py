from collections.abc import AsyncGenerator
from typing import Any
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import ExpiredSignatureError, JWTError
from jose import jwt as jose_jwt
from sqlalchemy.ext.asyncio import AsyncSession

from api.config import get_settings
from packages.db.session import get_session

settings = get_settings()
security = HTTPBearer(auto_error=False)

# プロセス内キャッシュ: 既知ユーザーはensure_user_existsをスキップ。
# ワーカー再起動でリセットされるがget_or_create_userは冪等なので問題ない。
_known_user_ids: set[UUID] = set()
_MAX_KNOWN_USERS = 10_000


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async for session in get_session():
        yield session


async def verify_jwt_token(token: str) -> dict[str, Any]:
    # 開発環境での一時的なテスト用認証
    if settings.env == "development" and token == "test":
        return {
            "sub": "00000000-0000-0000-0000-000000000000",  # Test user ID
            "email": "test@example.com",
            "aud": "authenticated",
        }

    try:
        payload = jose_jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            audience="authenticated",
        )
    except ExpiredSignatureError as err:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        ) from err
    except JWTError as err:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        ) from err

    return {
        "sub": payload.get("sub"),
        "email": payload.get("email"),
        "aud": payload.get("aud", "authenticated"),
    }


async def ensure_user_exists(user_id: UUID, email: str, db: AsyncSession) -> None:
    """認証されたユーザーがローカルDBに存在することを確認し、存在しなければ作成する"""
    if user_id in _known_user_ids:
        return

    from packages.services.user_service import UserService

    user_service = UserService(db)
    await user_service.get_or_create_user(user_id, email)

    # 無制限に肥大化するのを避けるため一定件数でリセット
    if len(_known_user_ids) >= _MAX_KNOWN_USERS:
        _known_user_ids.clear()
    _known_user_ids.add(user_id)


async def get_current_user_id(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> UUID:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = await verify_jwt_token(credentials.credentials)
    user_id = payload.get("sub")
    email = payload.get("email")

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_uuid = UUID(user_id)

    # ユーザーがローカルDBに存在することを確認し、存在しなければ作成
    if email:
        await ensure_user_exists(user_uuid, email, db)

    return user_uuid


async def get_optional_current_user_id(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> UUID | None:
    """
    現在のユーザーIDを取得（オプショナル）
    認証されていない場合はNoneを返す。ensure_user_exists(プロセス内キャッシュ付き)も行うため、
    認証済みリクエストでは必須版と同じ挙動になる。
    """
    if not credentials:
        return None

    try:
        payload = await verify_jwt_token(credentials.credentials)
    except HTTPException:
        return None

    user_id = payload.get("sub")
    email = payload.get("email")

    if not user_id:
        return None

    try:
        user_uuid = UUID(user_id)
    except ValueError:
        return None

    # ユーザーがローカルDBに存在することを確認し、存在しなければ作成
    if email:
        try:
            await ensure_user_exists(user_uuid, email, db)
        except HTTPException:
            return None

    return user_uuid
