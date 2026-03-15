"""add DM and personality tables

Revision ID: 382cbc49cab5
Revises: 6da60fd8b54a
Create Date: 2026-03-13 22:39:20.450325

"""

from collections.abc import Sequence

import sqlalchemy as sa
import sqlmodel
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "382cbc49cab5"
down_revision: str | None = "6da60fd8b54a"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Create conversations table
    op.create_table(
        "conversations",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    # Create conversation_participants table
    op.create_table(
        "conversation_participants",
        sa.Column("conversation_id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("last_read_at", sa.DateTime(), nullable=True),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["conversation_id"], ["conversations.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("conversation_id", "user_id"),
    )
    op.create_index(
        op.f("idx_conv_participants_user"), "conversation_participants", ["user_id"], unique=False
    )
    op.create_index(
        op.f("idx_conv_participants_conv"),
        "conversation_participants",
        ["conversation_id"],
        unique=False,
    )

    # Create direct_messages table
    op.create_table(
        "direct_messages",
        sa.Column("conversation_id", sa.Uuid(), nullable=False),
        sa.Column("sender_id", sa.Uuid(), nullable=False),
        sa.Column("content", sqlmodel.sql.sqltypes.AutoString(length=1000), nullable=False),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["conversation_id"], ["conversations.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["sender_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("idx_dm_conversation"),
        "direct_messages",
        ["conversation_id", "created_at"],
        unique=False,
    )
    op.create_index(op.f("idx_dm_sender"), "direct_messages", ["sender_id"], unique=False)

    # Create personality_results table
    op.create_table(
        "personality_results",
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("primary_type", sqlmodel.sql.sqltypes.AutoString(length=20), nullable=False),
        sa.Column("secondary_type", sqlmodel.sql.sqltypes.AutoString(length=20), nullable=True),
        sa.Column("scores", sa.JSON(), nullable=True),
        sa.Column("answers", sa.JSON(), nullable=True),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id"),
    )
    op.create_index(op.f("idx_personality_user"), "personality_results", ["user_id"], unique=False)
    op.create_index(
        op.f("idx_personality_primary"), "personality_results", ["primary_type"], unique=False
    )

    # Add personality_type column to users table
    op.add_column(
        "users",
        sa.Column("personality_type", sqlmodel.sql.sqltypes.AutoString(length=20), nullable=True),
    )


def downgrade() -> None:
    # Remove personality_type column from users table
    op.drop_column("users", "personality_type")

    # Drop personality_results table
    op.drop_index(op.f("idx_personality_primary"), table_name="personality_results")
    op.drop_index(op.f("idx_personality_user"), table_name="personality_results")
    op.drop_table("personality_results")

    # Drop direct_messages table
    op.drop_index(op.f("idx_dm_sender"), table_name="direct_messages")
    op.drop_index(op.f("idx_dm_conversation"), table_name="direct_messages")
    op.drop_table("direct_messages")

    # Drop conversation_participants table
    op.drop_index(op.f("idx_conv_participants_conv"), table_name="conversation_participants")
    op.drop_index(op.f("idx_conv_participants_user"), table_name="conversation_participants")
    op.drop_table("conversation_participants")

    # Drop conversations table
    op.drop_table("conversations")
