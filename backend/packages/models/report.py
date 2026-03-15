from datetime import datetime
from enum import StrEnum
from typing import TYPE_CHECKING, Optional
from uuid import UUID, uuid4

from sqlalchemy import Column
from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from .post import Post
    from .user import User
    # from .reply import Reply  # Replies are now stored in posts table


class ReportType(StrEnum):
    """報告タイプの列挙型"""

    SPAM = "spam"
    HARASSMENT = "harassment"
    INAPPROPRIATE = "inappropriate"
    OTHER = "other"


class ReportStatus(StrEnum):
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
    post_id: UUID | None = Field(default=None, foreign_key="posts.id", index=True)
    reply_id: UUID | None = Field(
        default=None, foreign_key="posts.id", index=True
    )  # Replies are now stored in posts table
    user_id: UUID | None = Field(default=None, foreign_key="users.id", index=True)

    # ステータス管理
    status: ReportStatus = Field(default=ReportStatus.PENDING, index=True)
    reviewed_at: datetime | None = None
    reviewer_id: UUID | None = Field(default=None, foreign_key="users.id")
    reviewer_comment: str | None = Field(default=None, max_length=1000)

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
        sa_relationship_kwargs={"foreign_keys": "Report.reporter_id"},
    )

    reported_post: Optional["Post"] = Relationship(
        back_populates="reports",
        sa_relationship_kwargs={
            "primaryjoin": "Report.post_id == Post.id",
            "foreign_keys": "[Report.post_id]",
        },
    )

    reported_reply: Optional["Post"] = Relationship(
        sa_relationship_kwargs={
            "primaryjoin": "Report.reply_id == Post.id",
            "foreign_keys": "[Report.reply_id]",
        }
    )

    reported_user: Optional["User"] = Relationship(
        back_populates="reports_about_me", sa_relationship_kwargs={"foreign_keys": "Report.user_id"}
    )

    reviewer: Optional["User"] = Relationship(
        sa_relationship_kwargs={"foreign_keys": "Report.reviewer_id"}
    )
