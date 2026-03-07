# Services

ビジネスロジック層の実装

## ファイル構成

- **user_service.py** - ユーザー関連のビジネスロジック
- **post_service.py** - 投稿関連のビジネスロジック
- **timeline_service.py** - タイムライン生成ロジック
- **reply_service.py** - リプライ関連のビジネスロジック

## サービス層の責務

### ビジネスロジックの実装
- ドメインルールの適用
- 複数リポジトリの調整
- データの変換・加工

### 実装例
```python
from sqlalchemy.ext.asyncio import AsyncSession
from packages.repositories.user_repository import UserRepository

class UserService:
    def __init__(self, session: AsyncSession):
        self.repository = UserRepository(session)

    async def get_or_create_user(self, user_id: UUID, email: str):
        # ビジネスロジック: 存在しない場合は作成
        user = await self.repository.get_by_id(user_id)
        if user:
            return user

        new_user = User(
            id=user_id,
            email=email,
            nickname="User",
            status="seeking",
            age_range="20s",
        )
        return await self.repository.create(new_user)
```

## Timeline Service の特殊ロジック

タイムライン表示のアルゴリズム：

```python
async def get_mixed_timeline(self, user_status: UserStatus):
    # 同じステータス: 80%
    same_status_limit = int(limit * 0.8)

    # 他のステータス: 20%
    other_status_limit = limit - same_status_limit

    # 結果を結合して時系列順にソート
    all_posts = same_status_posts + other_status_posts
    all_posts.sort(key=lambda p: p.created_at, reverse=True)
```

## サービス作成のガイドライン

1. **単一責任**: 1サービス1ドメイン
2. **依存性注入**: リポジトリはコンストラクタで注入
3. **エラーハンドリング**: ビジネスエラーは明示的に処理
4. **トランザクション境界**: サービスメソッドがトランザクション単位