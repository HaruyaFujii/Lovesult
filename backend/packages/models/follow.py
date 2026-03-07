from datetime import datetime
from typing import TYPE_CHECKING, Optional
from uuid import UUID, uuid4

from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from packages.models.user import User


class FollowBase(SQLModel):
    follower_id: UUID = Field(foreign_key="users.id", index=True)
    following_id: UUID = Field(foreign_key="users.id", index=True)


class Follow(FollowBase, table=True):
    __tablename__ = "follows"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    follower: Optional["User"] = Relationship(
        back_populates="following_relations",
        sa_relationship_kwargs={
            "foreign_keys": "[Follow.follower_id]",
            "post_update": True
        }
    )
    following: Optional["User"] = Relationship(
        back_populates="follower_relations",
        sa_relationship_kwargs={
            "foreign_keys": "[Follow.following_id]",
            "post_update": True
        }
    )

    __table_args__ = (
        {"extend_existing": True}
    )