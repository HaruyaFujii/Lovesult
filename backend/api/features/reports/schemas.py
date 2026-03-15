from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from packages.models.report import ReportStatus, ReportType


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
    post_id: UUID | None = None
    reply_id: UUID | None = None
    user_id: UUID | None = None

    # ステータス
    status: ReportStatus
    reviewed_at: datetime | None = None
    reviewer_id: UUID | None = None
    reviewer_comment: str | None = None

    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ReportListResponse(BaseModel):
    """報告リストレスポンススキーマ"""

    reports: list[ReportResponse]
    total: int
    has_more: bool
