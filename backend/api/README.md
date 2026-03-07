# API Layer

FastAPIのエントリーポイントとAPIレイヤー

## ディレクトリ構成

```
api/
├── main.py           # FastAPIアプリケーションのエントリーポイント
├── config/          # 設定管理
│   └── settings.py  # 環境変数と設定クラス
├── core/            # コア機能（認証、依存関係）
│   └── dependencies.py  # 共通依存（JWT検証、DBセッション）
└── features/        # 機能別API実装
    ├── health/      # ヘルスチェック
    ├── users/       # ユーザー管理
    ├── posts/       # 投稿管理
    └── replies/     # リプライ管理
```

## 各機能モジュールの構成

各feature配下は以下の3つのファイルで構成：

1. **router.py** - FastAPIのルーティング定義
2. **usecase.py** - ビジネスロジック層
3. **schemas.py** - Pydanticスキーマ（リクエスト/レスポンス）

## 責務の分離

- **Router**: HTTPリクエスト/レスポンスの処理
- **UseCase**: ビジネスルールの実装
- **Service**: データ操作とビジネスロジック（packages/services/）
- **Repository**: データベースアクセス（packages/repositories/）

## 新機能の追加方法

1. `api/features/`に新しいフォルダを作成
2. `router.py`, `usecase.py`, `schemas.py`を実装
3. `__init__.py`でrouterをexport
4. `main.py`でrouterを登録