# Repositories

データベースアクセス層の実装

## ファイル構成

- **user_repository.py** - ユーザーテーブルのCRUD
- **post_repository.py** - 投稿テーブルのCRUD + タイムラインクエリ
- **reply_repository.py** - リプライテーブルのCRUD

## リポジトリパターン

### 基本構造
```python
from sqlalchemy.ext.asyncio import AsyncSession

class SomeRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, id: UUID) -> Optional[Model]:
        # SELECT実装

    async def create(self, model: Model) -> Model:
        # INSERT実装

    async def update(self, model: Model) -> Model:
        # UPDATE実装

    async def delete(self, id: UUID) -> bool:
        # DELETE実装
```

### クエリ実装例

#### 基本的なSELECT
```python
from sqlalchemy import select

result = await self.session.execute(
    select(Model).where(Model.id == id)
)
return result.scalar_one_or_none()
```

#### JOINとEager Loading
```python
from sqlalchemy.orm import selectinload

result = await self.session.execute(
    select(Post)
    .options(selectinload(Post.user))
    .where(Post.id == post_id)
)
```

#### ページネーション
```python
query = select(Post).order_by(desc(Post.created_at))
if cursor:
    query = query.where(Post.created_at < cursor)
query = query.limit(limit + 1)
```

## トランザクション管理

- `session.add()` - エンティティの追加
- `session.commit()` - トランザクションのコミット
- `session.refresh()` - エンティティの再読み込み
- `session.rollback()` - ロールバック（エラー時）

## 新リポジトリ作成のガイドライン

1. 1モデル1リポジトリ
2. 基本CRUDメソッドの実装
3. 複雑なクエリは専用メソッドとして実装
4. N+1問題を避けるため、適切にEager Loadingを使用