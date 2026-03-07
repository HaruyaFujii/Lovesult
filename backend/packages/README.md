# Packages

ドメインロジックとインフラストラクチャ層

## ディレクトリ構成

```
packages/
├── models/          # SQLModelテーブル定義
├── repositories/    # データベースアクセス層
├── services/        # ビジネスロジック層
└── db/             # DB接続とマイグレーション
    └── migrations/  # Alembicマイグレーション
```

## アーキテクチャ層

### Models
- SQLModelを使用したテーブル定義
- リレーションシップの定義
- Enumやバリデーション

### Repositories
- データベースCRUD操作
- SQLクエリの実装
- トランザクション管理

### Services
- ビジネスロジックの実装
- 複数リポジトリの調整
- ドメインルールの適用

### DB
- データベース接続管理
- セッション管理
- マイグレーション設定

## 責務の分離

```
API Layer (UseCase)
    ↓
Service Layer (Business Logic)
    ↓
Repository Layer (Data Access)
    ↓
Model Layer (Data Structure)
    ↓
Database
```

## 新モデル追加の手順

1. `models/`にモデルファイル作成
2. `repositories/`にリポジトリ作成
3. `services/`にサービス作成
4. マイグレーション作成（詳細は`db/migrations/README.md`参照）