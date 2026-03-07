from typing import Optional
from pydantic import BaseModel

from api.features.users.schemas import UserResponse


class FollowStatusResponse(BaseModel):
    is_following: bool
    is_followed_by: bool


class FollowListResponse(BaseModel):
    users: list[UserResponse]
    next_cursor: Optional[str] = None