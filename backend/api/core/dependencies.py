from typing import AsyncGenerator, Optional
from uuid import UUID
import httpx

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession

from api.config import get_settings
from packages.db.session import get_session

settings = get_settings()
security = HTTPBearer(auto_error=False)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async for session in get_session():
        yield session


async def verify_jwt_token(token: str) -> dict:
    # 開発環境での一時的なテスト用認証
    if settings.env == "development" and token == "test":
        return {
            "sub": "00000000-0000-0000-0000-000000000000",  # Test user ID
            "email": "test@example.com",
            "aud": "authenticated",
        }

    try:
        print(f"DEBUG: Verifying token: {token[:20]}...")
        print(f"DEBUG: Supabase URL: {settings.supabase_url}")
        print(f"DEBUG: Supabase anon key: {settings.supabase_anon_key[:20]}...")

        # Supabaseのトークンを検証するためには、まず公開キーを取得する必要があります
        # しかし、簡単な方法として、SupabaseのAPIを使って検証しましょう
        async with httpx.AsyncClient() as client:
            headers = {
                "Authorization": f"Bearer {token}",
                "apikey": settings.supabase_anon_key,
            }
            response = await client.get(
                f"{settings.supabase_url}/auth/v1/user",
                headers=headers,
            )

            print(f"DEBUG: Supabase response status: {response.status_code}")
            print(f"DEBUG: Supabase response text: {response.text}")

            if response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid authentication credentials",
                    headers={"WWW-Authenticate": "Bearer"},
                )

            user_data = response.json()
            print(f"DEBUG: User data received: {user_data}")
            return {
                "sub": user_data.get("id"),
                "email": user_data.get("email"),
                "aud": "authenticated",
            }

    except httpx.RequestError as e:
        print(f"DEBUG: Request error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication service unavailable",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        print(f"DEBUG: Exception: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def ensure_user_exists(user_id: UUID, email: str, db: AsyncSession) -> None:
    """認証されたユーザーがローカルDBに存在することを確認し、存在しなければ作成する"""
    from packages.services.user_service import UserService

    user_service = UserService(db)
    await user_service.get_or_create_user(user_id, email)


async def get_current_user_id(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
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


async def get_current_user_id_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> Optional[UUID]:
    """
    現在のユーザーIDを取得（オプショナル）
    認証されていない場合はNoneを返す
    """
    if not credentials:
        return None

    try:
        payload = await verify_jwt_token(credentials.credentials)
        user_id = payload.get("sub")
        email = payload.get("email")

        if not user_id:
            return None

        user_uuid = UUID(user_id)

        # ユーザーがローカルDBに存在することを確認し、存在しなければ作成
        if email:
            await ensure_user_exists(user_uuid, email, db)

        return user_uuid
    except HTTPException:
        return None


async def get_optional_current_user_id(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> Optional[UUID]:
    if not credentials:
        return None

    try:
        payload = await verify_jwt_token(credentials.credentials)
        user_id = payload.get("sub")
        return UUID(user_id) if user_id else None
    except (HTTPException, ValueError):
        return None