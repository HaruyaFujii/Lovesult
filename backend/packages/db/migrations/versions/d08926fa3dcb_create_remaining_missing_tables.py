"""create remaining missing tables

Revision ID: d08926fa3dcb
Revises: 3887fb67a64d
Create Date: 2026-03-07 22:32:28.518685

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = 'd08926fa3dcb'
down_revision: Union[str, None] = '3887fb67a64d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create follows table
    op.create_table(
        'follows',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('follower_id', sa.UUID(), nullable=False),
        sa.Column('following_id', sa.UUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['follower_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['following_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('follower_id', 'following_id'),
        sa.CheckConstraint('follower_id != following_id')
    )
    op.create_index('idx_follows_follower', 'follows', ['follower_id'])
    op.create_index('idx_follows_following', 'follows', ['following_id'])

    # Create likes table
    op.create_table(
        'likes',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('post_id', sa.UUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['post_id'], ['posts.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'post_id')
    )
    op.create_index('idx_likes_post', 'likes', ['post_id'])
    op.create_index('idx_likes_user', 'likes', ['user_id'])

    # Create banned_words table
    op.create_table(
        'banned_words',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('word', sa.String(length=100), nullable=False),
        sa.Column('severity', sa.String(length=20), nullable=False, default='medium'),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('word')
    )
    op.create_index('idx_banned_words_active', 'banned_words', ['is_active'], postgresql_where=sa.text('is_active = true'))

    # Create reports table
    op.create_table(
        'reports',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('reporter_id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=True),
        sa.Column('post_id', sa.UUID(), nullable=True),
        sa.Column('reply_id', sa.UUID(), nullable=True),
        sa.Column('type', sa.String(length=20), nullable=False),
        sa.Column('reason', sa.String(length=500), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False, default='pending'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('resolved_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['reporter_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['post_id'], ['posts.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['reply_id'], ['replies.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_reports_status', 'reports', ['status', 'created_at'])
    op.create_index('idx_reports_reporter', 'reports', ['reporter_id'])


def downgrade() -> None:
    op.drop_table('reports')
    op.drop_table('banned_words')
    op.drop_table('likes')
    op.drop_table('follows')