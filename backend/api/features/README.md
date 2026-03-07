# Features

機能別API実装

## ディレクトリ構成

各機能は独立したモジュールとして実装：

```
features/
├── health/      # ヘルスチェック
├── users/       # ユーザー管理
├── posts/       # 投稿管理
└── replies/     # リプライ管理
```

## 共通ファイル構成

各featureフォルダは以下の3ファイルセットで構成：

### 1. router.py
- FastAPIルーター定義
- エンドポイントの実装
- HTTPステータスコードの管理
- エラーハンドリング

### 2. usecase.py
- ビジネスロジックの実装
- Service層の呼び出し
- ビジネスルールの適用
- エラーケースの処理

### 3. schemas.py
- Pydanticモデル定義
- リクエストボディのバリデーション
- レスポンスの型定義

## アーキテクチャ

```
HTTP Request
    ↓
Router (router.py)
    ↓
UseCase (usecase.py)
    ↓
Service (packages/services/)
    ↓
Repository (packages/repositories/)
    ↓
Database
```

## 新機能追加の手順

1. `features/`配下に新フォルダ作成
2. 3ファイルセット作成：
   - `router.py`: エンドポイント定義
   - `usecase.py`: ビジネスロジック
   - `schemas.py`: 入出力スキーマ
3. `__init__.py`でrouterをexport
4. `api/main.py`でルーター登録

## 実装例

新機能「お気に入り」を追加する場合：

```python
# features/favorites/__init__.py
from .router import router
__all__ = ["router"]

# features/favorites/router.py
from fastapi import APIRouter
router = APIRouter(prefix="/favorites", tags=["favorites"])

# features/favorites/usecase.py
class FavoriteUseCase:
    # ビジネスロジック実装

# features/favorites/schemas.py
class FavoriteCreate(BaseModel):
    # スキーマ定義
```