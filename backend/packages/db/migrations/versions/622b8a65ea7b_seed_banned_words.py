"""seed banned words

Revision ID: 622b8a65ea7b
Revises: 3b35fee50d44
Create Date: 2026-03-04 21:53:44.437999

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "622b8a65ea7b"
down_revision: str | None = "3b35fee50d44"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    from datetime import datetime
    from uuid import uuid4

    banned_words_table = sa.table(
        "banned_words",
        sa.column("id", sa.UUID),
        sa.column("word", sa.String),
        sa.column("severity", sa.String),
        sa.column("is_active", sa.Boolean),
        sa.column("created_at", sa.DateTime),
    )

    # 基本的な暴言・誹謗中傷ワード（日本語）
    banned_words = [
        # High severity
        {"word": "死ね", "severity": "high"},
        {"word": "殺す", "severity": "high"},
        {"word": "ころす", "severity": "high"},
        {"word": "しね", "severity": "high"},
        {"word": "消えろ", "severity": "high"},
        # Medium severity
        {"word": "きもい", "severity": "medium"},
        {"word": "キモい", "severity": "medium"},
        {"word": "ブス", "severity": "medium"},
        {"word": "ぶす", "severity": "medium"},
        {"word": "デブ", "severity": "medium"},
        {"word": "でぶ", "severity": "medium"},
        # Low severity
        {"word": "バカ", "severity": "low"},
        {"word": "ばか", "severity": "low"},
        {"word": "アホ", "severity": "low"},
        {"word": "あほ", "severity": "low"},
    ]

    # データを挿入用に準備
    data = []
    for word_data in banned_words:
        data.append(
            {
                "id": uuid4(),
                "word": word_data["word"],
                "severity": word_data["severity"],
                "is_active": True,
                "created_at": datetime.utcnow(),
            }
        )

    # 一括挿入
    if data:
        op.bulk_insert(banned_words_table, data)


def downgrade() -> None:
    # 初期データを削除（単語リストを指定して削除）
    op.execute("""
        DELETE FROM banned_words
        WHERE word IN (
            '死ね', '殺す', 'ころす', 'しね', '消えろ',
            'きもい', 'キモい', 'ブス', 'ぶす', 'デブ', 'でぶ',
            'バカ', 'ばか', 'アホ', 'あほ'
        )
    """)
