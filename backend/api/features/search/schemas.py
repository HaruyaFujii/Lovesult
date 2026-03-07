from typing import List, Optional
from pydantic import BaseModel
from api.features.posts.schemas import PostResponse


class SearchFilters(BaseModel):
    """検索フィルター"""
    status: Optional[str] = None  # in_love, heartbroken, seeking
    age_range: Optional[str] = None  # teens, twenties, thirties, forties_plus


class SearchRequest(BaseModel):
    """検索リクエスト"""
    query: Optional[str] = None
    filters: Optional[SearchFilters] = None
    cursor: Optional[str] = None
    limit: int = 20


class SearchResponse(BaseModel):
    """検索レスポンス"""
    posts: List[PostResponse]
    next_cursor: Optional[str] = None
    total_count: Optional[int] = None