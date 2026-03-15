from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr

from packages.models.user import AgeRange, Gender, UserStatus


class UserBase(BaseModel):
    nickname: str
    status: UserStatus
    gender: Gender
    age_range: AgeRange
    bio: str | None = None


class UserCreate(UserBase):
    email: EmailStr


class UserUpdate(BaseModel):
    nickname: str | None = None
    status: UserStatus | None = None
    gender: Gender | None = None
    age_range: AgeRange | None = None
    bio: str | None = None
    avatar_url: str | None = None


class UserResponse(UserBase):
    id: UUID
    email: str
    avatar_url: str | None = None
    followers_count: int = 0
    following_count: int = 0
    posts_count: int = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
