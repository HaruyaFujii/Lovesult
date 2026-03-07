from datetime import datetime
from enum import Enum
from typing import TYPE_CHECKING, List, Optional
from uuid import UUID

from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from packages.models.post import Post
    from packages.models.follow import Follow
    from packages.models.like import Like
    from packages.models.notification import Notification
    from packages.models.report import Report
    # from packages.models.bookmark import Bookmark
    # from packages.models.personality import Personality
    # from packages.models.message import Message
    # from packages.models.conversation import Conversation


class UserStatus(str, Enum):
    IN_LOVE = "IN_LOVE"
    HEARTBROKEN = "HEARTBROKEN"
    SEEKING = "SEEKING"


class Gender(str, Enum):
    MALE = "MALE"
    FEMALE = "FEMALE"
    OTHER = "OTHER"
    PRIVATE = "PRIVATE"


class AgeRange(str, Enum):
    TEENS = "TEENS"
    TWENTIES = "TWENTIES"
    THIRTIES = "THIRTIES"
    FORTIES = "FORTIES"
    FIFTIES_PLUS = "FIFTIES_PLUS"


class UserBase(SQLModel):
    email: str = Field(max_length=255, unique=True, index=True)
    nickname: str = Field(max_length=20)
    status: UserStatus
    gender: Gender = Field(default=Gender.PRIVATE)
    age_range: AgeRange
    bio: Optional[str] = Field(default=None, max_length=200)
    avatar_url: Optional[str] = Field(default=None, max_length=500)
    followers_count: int = Field(default=0)
    following_count: int = Field(default=0)


class User(UserBase, table=True):
    __tablename__ = "users"

    id: UUID = Field(primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    posts: List["Post"] = Relationship(back_populates="user")
    likes: List["Like"] = Relationship(back_populates="user")
    notifications: List["Notification"] = Relationship(
        back_populates="user",
        sa_relationship_kwargs={
            "foreign_keys": "[Notification.user_id]",
            "post_update": True
        }
    )

    # Follow relationships
    following_relations: List["Follow"] = Relationship(
        back_populates="follower",
        sa_relationship_kwargs={
            "foreign_keys": "[Follow.follower_id]",
            "cascade": "all, delete-orphan"
        }
    )
    follower_relations: List["Follow"] = Relationship(
        back_populates="following",
        sa_relationship_kwargs={
            "foreign_keys": "[Follow.following_id]",
            "cascade": "all, delete-orphan"
        }
    )

    # Report relationships
    reported_items: List["Report"] = Relationship(
        back_populates="reporter",
        sa_relationship_kwargs={
            "foreign_keys": "[Report.reporter_id]",
            "cascade": "all, delete-orphan"
        }
    )
    reports_about_me: List["Report"] = Relationship(
        back_populates="reported_user",
        sa_relationship_kwargs={
            "foreign_keys": "[Report.user_id]",
            "cascade": "all, delete-orphan"
        }
    )
    # bookmarks: List["Bookmark"] = Relationship(back_populates="user")
    # personality: Optional["Personality"] = Relationship(back_populates="user")

    # Message relationships with explicit joins - temporarily disabled due to relationship conflicts
    # sent_messages: List["Message"] = Relationship(
    #     back_populates="sender",
    #     sa_relationship_kwargs={
    #         "foreign_keys": "[Message.sender_id]",
    #         "primaryjoin": "User.id == Message.sender_id"
    #     }
    # )
    # received_messages: List["Message"] = Relationship(
    #     back_populates="recipient",
    #     sa_relationship_kwargs={
    #         "foreign_keys": "[Message.recipient_id]",
    #         "primaryjoin": "User.id == Message.recipient_id"
    #     }
    # )