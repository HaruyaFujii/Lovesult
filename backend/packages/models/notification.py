from datetime import datetime
from typing import TYPE_CHECKING, Optional
from uuid import UUID, uuid4

from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from packages.models.user import User
    from packages.models.post import Post
    from packages.models.reply import Reply


class NotificationBase(SQLModel):
    user_id: UUID = Field(foreign_key="users.id", index=True)  # 通知を受け取る人
    actor_id: UUID = Field(foreign_key="users.id", index=True)  # アクションした人
    type: str = Field(max_length=20)  # 'reply', 'follow', 'like'
    post_id: Optional[UUID] = Field(default=None, foreign_key="posts.id")  # 関連投稿（reply, like時）
    reply_id: Optional[UUID] = Field(default=None, foreign_key="replies.id")  # 関連リプライ（reply時）
    is_read: bool = Field(default=False)


class Notification(NotificationBase, table=True):
    __tablename__ = "notifications"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    user: Optional["User"] = Relationship(
        back_populates="notifications",
        sa_relationship_kwargs={
            "foreign_keys": "[Notification.user_id]",
            "post_update": True
        }
    )
    actor: Optional["User"] = Relationship(
        sa_relationship_kwargs={
            "foreign_keys": "[Notification.actor_id]",
            "post_update": True
        }
    )
    post: Optional["Post"] = Relationship()
    reply: Optional["Reply"] = Relationship()

    __table_args__ = (
        {"extend_existing": True}
    )