from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr

from packages.models.user import AgeRange, Gender, UserStatus


class UserBase(BaseModel):
    nickname: str
    status: UserStatus
    gender: Gender
    age_range: AgeRange
    bio: Optional[str] = None


class UserCreate(UserBase):
    email: EmailStr


class UserUpdate(BaseModel):
    nickname: Optional[str] = None
    status: Optional[UserStatus] = None
    gender: Optional[Gender] = None
    age_range: Optional[AgeRange] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None


class UserResponse(UserBase):
    id: UUID
    email: str
    avatar_url: Optional[str] = None
    followers_count: int = 0
    following_count: int = 0
    posts_count: int = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True