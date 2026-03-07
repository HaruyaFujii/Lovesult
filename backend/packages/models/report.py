from datetime import datetime
from typing import Optional, TYPE_CHECKING
from uuid import UUID, uuid4
from enum import Enum

from sqlalchemy import Column
from sqlmodel import Field, SQLModel, Relationship

if TYPE_CHECKING:
    from .user import User
    from .post import Post
    from .reply import Reply


class ReportType(str, Enum):
    """報告タイプの列挙型"""
    SPAM = "spam"
    HARASSMENT = "harassment"
    INAPPROPRIATE = "inappropriate"
    OTHER = "other"


class ReportStatus(str, Enum):
    """報告ステータスの列挙型"""
    PENDING = "pending"
    REVIEWED = "reviewed"
    RESOLVED = "resolved"
    DISMISSED = "dismissed"


class ReportBase(SQLModel):
    """報告の基本モデル"""
    reporter_id: UUID = Field(foreign_key="users.id", index=True)
    report_type: ReportType
    reason: str = Field(min_length=1, max_length=1000)

    # 報告対象（いずれか一つ）
    post_id: Optional[UUID] = Field(default=None, foreign_key="posts.id", index=True)
    reply_id: Optional[UUID] = Field(default=None, foreign_key="replies.id", index=True)
    user_id: Optional[UUID] = Field(default=None, foreign_key="users.id", index=True)

    # ステータス管理
    status: ReportStatus = Field(default=ReportStatus.PENDING, index=True)
    reviewed_at: Optional[datetime] = None
    reviewer_id: Optional[UUID] = Field(default=None, foreign_key="users.id")
    reviewer_comment: Optional[str] = Field(default=None, max_length=1000)

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(default=datetime.utcnow, onupdate=datetime.utcnow),
    )


class Report(ReportBase, table=True):
    """報告テーブルモデル"""
    __tablename__ = "reports"

    id: UUID = Field(default_factory=uuid4, primary_key=True)

    # リレーション
    reporter: Optional["User"] = Relationship(
        back_populates="reported_items",
        sa_relationship_kwargs={"foreign_keys": "Report.reporter_id"}
    )

    reported_post: Optional["Post"] = Relationship(
        back_populates="reports",
        sa_relationship_kwargs={"foreign_keys": "Report.post_id"}
    )

    reported_reply: Optional["Reply"] = Relationship(
        back_populates="reports",
        sa_relationship_kwargs={"foreign_keys": "Report.reply_id"}
    )

    reported_user: Optional["User"] = Relationship(
        back_populates="reports_about_me",
        sa_relationship_kwargs={"foreign_keys": "Report.user_id"}
    )

    reviewer: Optional["User"] = Relationship(
        sa_relationship_kwargs={"foreign_keys": "Report.reviewer_id"}
    )