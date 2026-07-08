---
name: backend-feature
description: backendに新しいAPIエンドポイントや機能を追加する。Router→UseCase→Service→Repositoryの階層パターンに従った実装手順。既存エンドポイントの拡張時も参照する。
---

## 作成するファイル一覧

新機能 `{name}` に必要なファイル:

```
backend/
├── api/features/{name}/
│   ├── __init__.py
│   ├── router.py
│   ├── schemas.py
│   └── usecase.py
└── packages/
    ├── models/{name}.py          # 新テーブルが必要な場合のみ
    ├── repositories/{name}_repository.py
    └── services/{name}_service.py
```

## 各レイヤーの責務

- **router.py** — HTTP入出力と `Depends()` 注入のみ。ビジネスロジックは持たない。UseCase を `__init__` せずエンドポイントごとにインスタンス化する。クラス名例: なし(関数ベース)、`APIRouter(tags=["{name}s"])`
- **usecase.py** — 複数 Service を組み合わせ、`session.commit()` を呼ぶ唯一の場所。クラス名: `{Name}UseCase`
- **service.py** — ビジネスロジック。Repository を呼び、通知など副作用も担う。クラス名: `{Name}Service`、`self.repository = {Name}Repository(session)`
- **repository.py** — SQLAlchemy/SQLModel のクエリのみ。クラス名: `{Name}Repository`
- **schemas.py** — `{Name}Base`, `{Name}Create`, `{Name}Update`, `{Name}Response` の命名規則。`class Config: from_attributes = True` を Response に付ける

## 実装手順

1. `schemas.py` を定義する
2. `packages/models/{name}.py` を追加する(新テーブルが必要な場合)→ db-migration スキルでマイグレーション
3. `packages/repositories/{name}_repository.py` を実装する
4. `packages/services/{name}_service.py` を実装する
5. `api/features/{name}/usecase.py` を実装する
6. `api/features/{name}/router.py` を実装する
7. `api/main.py` に `include_router` を追加する

### router.py の実装例(likes/router.py より抜粋)

```python
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from api.core.dependencies import get_current_user_id, get_db
from .usecase import {Name}UseCase

router = APIRouter(tags=["{name}s"])

@router.post("/{name}s", operation_id="create{Name}")
async def create_{name}(
    body: {Name}Create,
    current_user_id: UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> {Name}Response:
    usecase = {Name}UseCase(db)
    return await usecase.create_{name}(current_user_id, body)
```

認証不要のエンドポイントは `get_optional_current_user_id` を使う。

### api/main.py への登録

```python
from api.features.{name}.router import router as {name}_router
app.include_router({name}_router, prefix="/api/v1")
```

## モデル追加時

新しい SQLModel クラスを追加したら db-migration スキルを参照してマイグレーションを作成・適用する。

## 仕上げ

```
make lint && make test
```

テストは `tests/test_api/test_{name}.py` に追加する。conftest.py の既存 fixture を活用する:

- `client` — `AsyncClient` (httpx)。`override_get_session` を自動適用済み
- `async_session` — `AsyncSession` (SQLite in-memory)
- `test_user` / `another_test_user` — `User` モデルのインスタンス
- `test_post` — `Post` モデルのインスタンス
- `auth_headers` — `{"Authorization": "Bearer test-token"}`

API スキーマを変更したら sync-api スキルで frontend と型同期する。

## 注意点

- `packages/repositories/` は ruff と mypy の両方の exclude 対象になっている。リポジトリ層のコードは lint/type-check が走らないため、**型エラーや未使用インポートが静かに残る**。手動でレビューすること
- `packages/db/migrations/versions/` も同様に exclude 対象
- `Depends()` をデフォルト引数に使うパターンは ruff の B008 ルールで除外済みなので警告は出ない
- UseCase 内でのみ `await session.commit()` を呼ぶ。Service と Repository は commit しない
