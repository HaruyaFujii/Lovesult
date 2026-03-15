from pydantic import BaseModel

from api.features.posts.schemas import PostResponse
from api.features.users.schemas import UserResponse


class SearchFilters(BaseModel):
    """検索フィルター"""

    status: str | None = None  # in_love, heartbroken, seeking
    age_range: str | None = None  # teens, twenties, thirties, forties_plus


class SearchRequest(BaseModel):
    """検索リクエスト"""

    query: str | None = None
    filters: SearchFilters | None = None
    cursor: str | None = None
    limit: int = 20


class PostSearchResponse(BaseModel):
    """投稿検索レスポンス"""

    posts: list[PostResponse]
    next_cursor: str | None = None
    total_count: int | None = None


class UserSearchResponse(BaseModel):
    """ユーザー検索レスポンス"""

    users: list[UserResponse]
    next_cursor: str | None = None
    total_count: int | None = None


# 後方互換性のために SearchResponse を PostSearchResponse のエイリアスとして残す
SearchResponse = PostSearchResponse
