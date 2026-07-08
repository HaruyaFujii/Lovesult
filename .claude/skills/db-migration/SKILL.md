---
name: db-migration
description: SQLModelモデルの追加・変更時にAlembicマイグレーションを生成・適用する。packages/models/ を触ったら必ず使う。
---

## 手順

1. **モデルを定義・変更する**

   `backend/packages/models/{name}.py` に SQLModel クラスを定義または変更する。

2. **schemas.py に追加する**

   `packages/models/schemas.py` を開き、新しいモデルを import して `__all__` に追加する。

   Alembic の `env.py` は `from packages.models import schemas` でこのファイルを読み込み、`SQLModel.metadata` に載っているモデルを autogenerate の対象とする。`schemas.py` への登録が漏れると差分が検出されないため必ず確認する。

   現在の登録パターン(実際のファイルを参照):
   ```python
   # packages/models/schemas.py
   from packages.models.{name} import {ClassName}

   __all__ = [..., "{ClassName}"]
   ```

3. **マイグレーションファイルを生成する**

   ```bash
   cd backend && make migrate-create name="add_xxx_table"
   ```

   `packages/db/migrations/versions/` に新しいファイルが生成される。

4. **生成ファイルを必ずレビューする**

   autogenerate は index や複合制約、サーバーデフォルト等を取りこぼすことがある。生成された `upgrade()` / `downgrade()` を開いて意図した差分になっているか確認し、必要なら手修正する。

5. **マイグレーションを適用する**

   ```bash
   make migrate
   ```

   `alembic upgrade head` が実行される。

## 補足

- **テストはマイグレーション不要**: テストは SQLite in-memory を使用し、`SQLModel.metadata.create_all()` で直接テーブルを生成する。マイグレーションファイルはテストに影響しない
- **DB は Supabase の PostgreSQL**: `DATABASE_URL` 環境変数で接続先を指定する
- **接続エラー時**: `DATABASE_URL` の末尾に `?sslmode=require` を追加して試す
- **alembic.ini の場所**: `backend/` ルート。`make migrate` はこのディレクトリで実行する
