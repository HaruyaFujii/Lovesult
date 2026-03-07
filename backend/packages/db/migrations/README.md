# Database Migrations

Alembicを使用したデータベースマイグレーション管理

## 概要

Alembicは、SQLAlchemyのためのデータベースマイグレーションツールです。
スキーマの変更履歴を管理し、本番環境へのデプロイを安全に行えます。

## マイグレーション実行手順

### 1. 初回セットアップ（プロジェクト開始時）

```bash
# 最新のマイグレーションまで適用
make migrate

# または直接コマンド
alembic upgrade head
```

### 2. 新しいテーブル・カラムを追加する場合

#### Step 1: モデルを作成/修正

```python
# packages/models/new_model.py
from sqlmodel import SQLModel, Field

class NewModel(SQLModel, table=True):
    __tablename__ = "new_table"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    name: str = Field(max_length=100)
    created_at: datetime = Field(default_factory=datetime.utcnow)
```

#### Step 2: env.pyでモデルをインポート

```python
# packages/db/migrations/env.py
from packages.models import User, Post, Reply, NewModel  # 新モデルを追加
```

#### Step 3: マイグレーションファイル生成

```bash
# 自動生成
make migrate-create name="add_new_table"

# または直接コマンド
alembic revision --autogenerate -m "add_new_table"
```

#### Step 4: 生成されたファイルを確認

```bash
# versions/配下に新しいファイルが作成される
ls packages/db/migrations/versions/

# 内容を確認
cat packages/db/migrations/versions/xxxx_add_new_table.py
```

#### Step 5: マイグレーション実行

```bash
make migrate
```

## よく使うコマンド

### 状態確認

```bash
# 現在のリビジョン確認
alembic current

# マイグレーション履歴
alembic history

# 詳細な履歴
alembic history --verbose
```

### マイグレーション操作

```bash
# 最新まで適用
alembic upgrade head

# 特定のリビジョンまで適用
alembic upgrade +2  # 2つ先へ
alembic upgrade ae10  # リビジョンIDを指定

# ロールバック
alembic downgrade -1  # 1つ前に戻る
alembic downgrade base  # 初期状態に戻る
```

### トラブルシューティング

```bash
# マイグレーションの状態をリセット（危険！）
alembic stamp head

# SQLを表示（実行しない）
alembic upgrade head --sql

# オフラインモード（DB接続なし）でSQL生成
alembic upgrade head --sql > migration.sql
```

## 注意事項

### 1. 本番環境でのマイグレーション

```bash
# 必ずバックアップを取る
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# ドライランで確認
alembic upgrade head --sql

# 実行
alembic upgrade head
```

### 2. チーム開発時の注意

- マイグレーションファイルは必ずGitにコミット
- ブランチをマージする際、マイグレーションの順序に注意
- 競合が発生した場合は、リビジョンIDを調整

### 3. よくあるエラー

#### "Target database is not up to date"

```bash
# 現在の状態を確認
alembic current

# 必要なマイグレーションを適用
alembic upgrade head
```

#### "Can't locate revision identified by"

```bash
# マイグレーション履歴をリセット（開発環境のみ）
alembic stamp head
```

#### "Multiple head revisions"

```bash
# ヘッドをマージ
alembic merge -m "merge heads"
```

## マイグレーションファイルの構造

```python
"""add user table

Revision ID: abc123
Revises: def456
Create Date: 2024-01-01 12:00:00

"""

def upgrade() -> None:
    # テーブル作成、カラム追加など
    op.create_table(
        'users',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('email', sa.String(255), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )

def downgrade() -> None:
    # ロールバック処理
    op.drop_table('users')
```

## ベストプラクティス

1. **小さな変更単位でマイグレーション作成**
   - 1つのマイグレーション = 1つの機能

2. **必ずdowngrade()も実装**
   - ロールバック可能にしておく

3. **データマイグレーションは別途作成**
   - スキーマ変更とデータ移行は分離

4. **本番適用前にステージング環境でテスト**
   - 必ず事前検証を行う