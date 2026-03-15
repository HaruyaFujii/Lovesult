"""fix user status enum values

Revision ID: d5a995d87a6c
Revises: 4ced072b4d53
Create Date: 2026-03-07 18:44:39.962000

"""

from collections.abc import Sequence

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "d5a995d87a6c"
down_revision: str | None = "4ced072b4d53"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Update existing user status values to match the new enum format
    op.execute("UPDATE users SET status = UPPER(status)")
    op.execute("UPDATE users SET status = 'IN_LOVE' WHERE status = 'IN_LOVE'")
    op.execute("UPDATE users SET status = 'HEARTBROKEN' WHERE status = 'HEARTBROKEN'")
    op.execute("UPDATE users SET status = 'SEEKING' WHERE status = 'SEEKING'")

    # Update gender values
    op.execute("UPDATE users SET gender = UPPER(gender)")
    op.execute("UPDATE users SET gender = 'MALE' WHERE gender = 'MALE'")
    op.execute("UPDATE users SET gender = 'FEMALE' WHERE gender = 'FEMALE'")
    op.execute("UPDATE users SET gender = 'OTHER' WHERE gender = 'OTHER'")
    op.execute("UPDATE users SET gender = 'PRIVATE' WHERE gender = 'PRIVATE'")

    # Update age_range values
    op.execute("UPDATE users SET age_range = '10S' WHERE age_range = '10s'")
    op.execute("UPDATE users SET age_range = '20S' WHERE age_range = '20s'")
    op.execute("UPDATE users SET age_range = '30S' WHERE age_range = '30s'")
    op.execute("UPDATE users SET age_range = '40S' WHERE age_range = '40s'")
    op.execute("UPDATE users SET age_range = '50S_PLUS' WHERE age_range = '50s_plus'")

    # Map to the actual enum values
    op.execute("UPDATE users SET age_range = 'TEENS' WHERE age_range = '10S'")
    op.execute("UPDATE users SET age_range = 'TWENTIES' WHERE age_range = '20S'")
    op.execute("UPDATE users SET age_range = 'THIRTIES' WHERE age_range = '30S'")
    op.execute("UPDATE users SET age_range = 'FORTIES' WHERE age_range = '40S'")
    op.execute("UPDATE users SET age_range = 'FIFTIES_PLUS' WHERE age_range = '50S_PLUS'")

    # Update posts author_status and author_age_range values
    op.execute("UPDATE posts SET author_status = UPPER(author_status)")
    op.execute("UPDATE posts SET author_status = 'IN_LOVE' WHERE author_status = 'IN_LOVE'")
    op.execute("UPDATE posts SET author_status = 'HEARTBROKEN' WHERE author_status = 'HEARTBROKEN'")
    op.execute("UPDATE posts SET author_status = 'SEEKING' WHERE author_status = 'SEEKING'")

    op.execute("UPDATE posts SET author_age_range = '10S' WHERE author_age_range = '10s'")
    op.execute("UPDATE posts SET author_age_range = '20S' WHERE author_age_range = '20s'")
    op.execute("UPDATE posts SET author_age_range = '30S' WHERE author_age_range = '30s'")
    op.execute("UPDATE posts SET author_age_range = '40S' WHERE author_age_range = '40s'")
    op.execute("UPDATE posts SET author_age_range = '50S_PLUS' WHERE author_age_range = '50s_plus'")

    op.execute("UPDATE posts SET author_age_range = 'TEENS' WHERE author_age_range = '10S'")
    op.execute("UPDATE posts SET author_age_range = 'TWENTIES' WHERE author_age_range = '20S'")
    op.execute("UPDATE posts SET author_age_range = 'THIRTIES' WHERE author_age_range = '30S'")
    op.execute("UPDATE posts SET author_age_range = 'FORTIES' WHERE author_age_range = '40S'")
    op.execute(
        "UPDATE posts SET author_age_range = 'FIFTIES_PLUS' WHERE author_age_range = '50S_PLUS'"
    )


def downgrade() -> None:
    # Revert enum values to lowercase format
    op.execute("UPDATE users SET status = LOWER(status)")
    op.execute("UPDATE users SET gender = LOWER(gender)")

    op.execute("UPDATE users SET age_range = '10s' WHERE age_range = 'TEENS'")
    op.execute("UPDATE users SET age_range = '20s' WHERE age_range = 'TWENTIES'")
    op.execute("UPDATE users SET age_range = '30s' WHERE age_range = 'THIRTIES'")
    op.execute("UPDATE users SET age_range = '40s' WHERE age_range = 'FORTIES'")
    op.execute("UPDATE users SET age_range = '50s_plus' WHERE age_range = 'FIFTIES_PLUS'")

    op.execute("UPDATE posts SET author_status = LOWER(author_status)")

    op.execute("UPDATE posts SET author_age_range = '10s' WHERE author_age_range = 'TEENS'")
    op.execute("UPDATE posts SET author_age_range = '20s' WHERE author_age_range = 'TWENTIES'")
    op.execute("UPDATE posts SET author_age_range = '30s' WHERE author_age_range = 'THIRTIES'")
    op.execute("UPDATE posts SET author_age_range = '40s' WHERE author_age_range = 'FORTIES'")
    op.execute(
        "UPDATE posts SET author_age_range = '50s_plus' WHERE author_age_range = 'FIFTIES_PLUS'"
    )
