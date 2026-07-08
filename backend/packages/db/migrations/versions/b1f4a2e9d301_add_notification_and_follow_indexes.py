"""Add notification and follow indexes for perf

Revision ID: b1f4a2e9d301
Revises: 256d6071644b
Create Date: 2026-07-09 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "b1f4a2e9d301"
down_revision: Union[str, None] = "256d6071644b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 未読通知件数取得と未読一覧表示の高速化
    op.create_index(
        "ix_notifications_user_is_read",
        "notifications",
        ["user_id", "is_read"],
        unique=False,
    )
    # 通知一覧のカーソルページネーション(created_at DESC)高速化
    op.create_index(
        "ix_notifications_created_at",
        "notifications",
        ["created_at"],
        unique=False,
    )
    # フォロー一覧のカーソルページネーション(created_at DESC)高速化
    op.create_index(
        "ix_follows_created_at",
        "follows",
        ["created_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_follows_created_at", table_name="follows")
    op.drop_index("ix_notifications_created_at", table_name="notifications")
    op.drop_index("ix_notifications_user_is_read", table_name="notifications")
