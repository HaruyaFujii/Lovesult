# Core

アプリケーション全体で使用される共通機能

## ファイル構成

- **dependencies.py** - FastAPI依存関数

## Dependencies

### 認証関連

- `get_current_user_id()` - 認証必須エンドポイント用（JWTから user_id 取得）
- `get_optional_current_user_id()` - 認証オプショナル（ログインしていなくてもOK）
- `verify_jwt_token()` - Supabase JWTの検証

### データベース

- `get_db()` - AsyncSessionの取得（リクエストごと）

## JWT検証の仕組み

1. `Authorization: Bearer <token>` ヘッダーからトークン取得
2. Supabase JWT Secretで検証
3. ペイロードから`sub`（user_id）を抽出

## 使用例

```python
from api.core.dependencies import get_current_user_id, get_db

@router.post("/posts")
async def create_post(
    current_user_id: UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    # 認証済みユーザーのみアクセス可能
    pass
```