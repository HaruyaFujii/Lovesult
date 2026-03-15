"""create postgresql enum types

Revision ID: a3a0847e16e7
Revises: d5a995d87a6c
Create Date: 2026-03-07 22:03:34.125890

"""

from collections.abc import Sequence

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "a3a0847e16e7"
down_revision: str | None = "d5a995d87a6c"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Create ENUM types for PostgreSQL
    from sqlalchemy.dialects.postgresql import ENUM

    # Create UserStatus ENUM
    userstatus_enum = ENUM(
        "IN_LOVE", "HEARTBROKEN", "SEEKING", name="userstatus", create_type=False
    )
    userstatus_enum.create(op.get_bind(), checkfirst=True)

    # Create Gender ENUM
    gender_enum = ENUM("MALE", "FEMALE", "OTHER", "PRIVATE", name="gender", create_type=False)
    gender_enum.create(op.get_bind(), checkfirst=True)

    # Create AgeRange ENUM
    agerange_enum = ENUM(
        "TEENS",
        "TWENTIES",
        "THIRTIES",
        "FORTIES",
        "FIFTIES_PLUS",
        name="agerange",
        create_type=False,
    )
    agerange_enum.create(op.get_bind(), checkfirst=True)


def downgrade() -> None:
    # Drop ENUM types
    op.execute("DROP TYPE IF EXISTS userstatus CASCADE")
    op.execute("DROP TYPE IF EXISTS gender CASCADE")
    op.execute("DROP TYPE IF EXISTS agerange CASCADE")
