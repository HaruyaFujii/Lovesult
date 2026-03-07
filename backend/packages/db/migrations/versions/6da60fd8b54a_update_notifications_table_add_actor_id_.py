"""update notifications table add actor_id post_id reply_id and make title message optional

Revision ID: 6da60fd8b54a
Revises: d08926fa3dcb
Create Date: 2026-03-07 23:21:59.088517

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '6da60fd8b54a'
down_revision: Union[str, None] = 'd08926fa3dcb'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add new columns to notifications table
    op.add_column('notifications', sa.Column('actor_id', postgresql.UUID(as_uuid=True), nullable=True))
    op.add_column('notifications', sa.Column('post_id', postgresql.UUID(as_uuid=True), nullable=True))
    op.add_column('notifications', sa.Column('reply_id', postgresql.UUID(as_uuid=True), nullable=True))

    # Make title and message nullable
    op.alter_column('notifications', 'title',
               existing_type=sa.VARCHAR(length=200),
               nullable=True)
    op.alter_column('notifications', 'message',
               existing_type=sa.VARCHAR(length=500),
               nullable=True)

    # Add foreign keys
    op.create_foreign_key('notifications_actor_id_fkey', 'notifications', 'users', ['actor_id'], ['id'])
    op.create_foreign_key('notifications_post_id_fkey', 'notifications', 'posts', ['post_id'], ['id'])
    op.create_foreign_key('notifications_reply_id_fkey', 'notifications', 'replies', ['reply_id'], ['id'])


def downgrade() -> None:
    # Remove foreign keys
    op.drop_constraint('notifications_reply_id_fkey', 'notifications', type_='foreignkey')
    op.drop_constraint('notifications_post_id_fkey', 'notifications', type_='foreignkey')
    op.drop_constraint('notifications_actor_id_fkey', 'notifications', type_='foreignkey')

    # Make title and message required again
    op.alter_column('notifications', 'message',
               existing_type=sa.VARCHAR(length=500),
               nullable=False)
    op.alter_column('notifications', 'title',
               existing_type=sa.VARCHAR(length=200),
               nullable=False)

    # Remove columns
    op.drop_column('notifications', 'reply_id')
    op.drop_column('notifications', 'post_id')
    op.drop_column('notifications', 'actor_id')