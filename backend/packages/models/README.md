# Models

SQLModelを使用したデータベースモデル定義

## ファイル構成

- **user.py** - ユーザーモデル
- **post.py** - 投稿モデル
- **reply.py** - リプライモデル

## モデル定義のルール

### 基本構造
```python
from sqlmodel import SQLModel, Field

class ModelBase(SQLModel):
    # 共通フィールド定義
    field_name: type = Field(...)

class Model(ModelBase, table=True):
    __tablename__ = "table_name"

    # PK、FK、timestamp等
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
```

### リレーションシップ
```python
from sqlmodel import Relationship

class User(UserBase, table=True):
    posts: List["Post"] = Relationship(back_populates="user")

class Post(PostBase, table=True):
    user: Optional["User"] = Relationship(back_populates="posts")
```

### Enum定義
```python
from enum import Enum

class UserStatus(str, Enum):
    IN_LOVE = "in_love"
    HEARTBROKEN = "heartbroken"
    SEEKING = "seeking"
```

## 新モデル追加時の注意点

1. `table=True`を付けてテーブル定義であることを明示
2. `__tablename__`でテーブル名を指定
3. リレーションシップは`TYPE_CHECKING`でcircular importを回避
4. マイグレーションファイルの生成（`make migrate-create`）