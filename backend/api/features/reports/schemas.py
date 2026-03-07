from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field

from packages.models.report import ReportType, ReportStatus


class ReportCreate(BaseModel):
    """報告作成用スキーマ"""
    target_type: str = Field(..., pattern="^(post|reply|user)$")
    target_id: UUID
    report_type: ReportType
    reason: str = Field(..., min_length=1, max_length=1000)


class ReportResponse(BaseModel):
    """報告レスポンススキーマ"""
    id: UUID
    reporter_id: UUID
    report_type: ReportType
    reason: str

    # 報告対象
    post_id: Optional[UUID] = None
    reply_id: Optional[UUID] = None
    user_id: Optional[UUID] = None

    # ステータス
    status: ReportStatus
    reviewed_at: Optional[datetime] = None
    reviewer_id: Optional[UUID] = None
    reviewer_comment: Optional[str] = None

    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ReportListResponse(BaseModel):
    """報告リストレスポンススキーマ"""
    reports: list[ReportResponse]
    total: int
    has_more: bool