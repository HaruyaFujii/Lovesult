from datetime import datetime
from typing import TYPE_CHECKING, Optional
from uuid import UUID, uuid4

from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from packages.models.post import Post
    from packages.models.user import User


class LikeBase(SQLModel):
    user_id: UUID = Field(foreign_key="users.id", index=True)
    post_id: UUID = Field(foreign_key="posts.id", index=True)


class Like(LikeBase, table=True):
    __tablename__ = "likes"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    user: Optional["User"] = Relationship(back_populates="likes")
    post: Optional["Post"] = Relationship(back_populates="likes")

    __table_args__ = {"extend_existing": True}
