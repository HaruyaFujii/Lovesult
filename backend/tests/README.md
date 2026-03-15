# Backend Test Suite

## 概要

このディレクトリには、Lovesult バックエンドアプリケーションの包括的なテストスイートが含まれています。実務レベルの品質とカバレッジを目指したテスト構造となっています。

## テスト構造

```
tests/
├── conftest.py                     # テスト設定・フィクスチャ
├── test_api/                       # APIエンドポイントテスト
│   ├── test_users.py              # ユーザーAPI
│   └── test_posts.py              # 投稿API
├── test_services/                  # サービス層テスト
│   ├── test_user_service.py       # ユーザーサービス
│   └── test_post_service.py       # 投稿サービス
├── test_repositories/              # リポジトリ層テスト
│   ├── test_user_repository.py    # ユーザーリポジトリ
│   └── test_post_repository.py    # 投稿リポジトリ
└── test_integration/               # 統合テスト
    └── test_user_workflow.py      # ユーザーワークフロー
```

## テスト実行方法

### 全テスト実行
```bash
make test
```

### 特定のテストカテゴリ実行
```bash
# APIテストのみ
uv run --with pytest pytest tests/test_api -v

# サービス層テストのみ
uv run --with pytest pytest tests/test_services -v

# リポジトリ層テストのみ
uv run --with pytest pytest tests/test_repositories -v

# 統合テストのみ
uv run --with pytest pytest tests/test_integration -v
```

### 特定のテストファイル実行
```bash
uv run --with pytest pytest tests/test_api/test_users.py -v
```

### 特定のテストメソッド実行
```bash
uv run --with pytest pytest tests/test_api/test_users.py::TestUsersAPI::test_get_user_by_id_success -v
```

## テストの特徴

### 1. レイヤード・アーキテクチャ対応
- **API層**: HTTPエンドポイントのテスト
- **サービス層**: ビジネスロジックのテスト（モック使用）
- **リポジトリ層**: データベース操作のテスト
- **統合テスト**: エンドツーエンドワークフローのテスト

### 2. 実務的なテストパターン
- **正常系・異常系の両方をカバー**
- **バリデーション要件のテスト**
- **認証・認可のテスト**
- **ページネーションのテスト**
- **フィルタリング機能のテスト**
- **エラーハンドリングのテスト**

### 3. テストデータ管理
- **Fixtures**: 再利用可能なテストデータ
- **Factory パターン**: テストユーザー・投稿の生成
- **Database Isolation**: テスト間のデータ分離

### 4. モッキング戦略
- **サービス層**: 依存関係をモック化
- **API層**: 認証・外部サービスをモック化
- **統合テスト**: 最小限のモック使用

## テストケースの種類

### APIテスト
- ✅ ステータスコードの検証
- ✅ レスポンス形式の検証
- ✅ エラーレスポンスの検証
- ✅ バリデーションエラーの検証
- ✅ 認証・認可の検証

### サービス層テスト
- ✅ ビジネスロジックの検証
- ✅ エラーハンドリングの検証
- ✅ データ変換の検証
- ✅ バリデーション処理の検証

### リポジトリ層テスト
- ✅ CRUD操作の検証
- ✅ フィルタリング・ソートの検証
- ✅ ページネーションの検証
- ✅ データ整合性の検証

### 統合テスト
- ✅ エンドツーエンドワークフロー
- ✅ 複数コンポーネント間の連携
- ✅ 実際のユーザーシナリオ

## テスト環境設定

### 必要な依存関係
```toml
[project.optional-dependencies]
dev = [
    "pytest>=7.4.0",
    "pytest-asyncio>=0.23.0",
    "httpx>=0.26.0",       # HTTP client for API testing
    "factory-boy>=3.3.0",  # Test data factories
    "freezegun>=1.2.0",    # Time mocking
]
```

### 環境変数
テスト実行時は専用のテストデータベースを使用：
```bash
TEST_DATABASE_URL=sqlite+aiosqlite:///./test.db
```

## テスト作成のガイドライン

### 1. 命名規則
- **テストクラス**: `Test{ComponentName}`
- **テストメソッド**: `test_{action}_{condition}`
- **Fixtures**: 説明的な名前を使用

### 2. テスト構造
```python
def test_action_condition(self, fixtures...):
    # Setup (Given)
    # ... テストデータの準備

    # Execute (When)
    # ... テスト対象の実行

    # Assert (Then)
    # ... 結果の検証
```

### 3. アサーション
- 明確で読みやすいアサーション
- エラーメッセージの検証
- データ型・値の両方を検証

## カバレッジ目標

- **全体**: 80% 以上
- **ビジネスロジック**: 90% 以上
- **API エンドポイント**: 85% 以上

## CI/CD統合

このテストスイートは以下の場面で自動実行されます：
- プルリクエスト作成時
- メインブランチへのマージ時
- デプロイ前の検証
- 定期的な品質チェック

## トラブルシューティング

### よくある問題

1. **インポートエラー**
   - 依存関係をインストール: `uv sync --dev`
   - パッケージ構造を確認

2. **データベースエラー**
   - テスト用DBの権限を確認
   - マイグレーションの実行

3. **非同期テストエラー**
   - pytest-asyncio の設定を確認
   - イベントループの適切な処理

### デバッグ
```bash
# 詳細出力でテスト実行
uv run --with pytest pytest tests/ -v -s

# 失敗時にデバッガーを起動
uv run --with pytest pytest tests/ --pdb

# 特定のテストのみ実行して調査
uv run --with pytest pytest tests/path/to/test.py::test_name -v -s
```

## 今後の拡張予定

- [ ] パフォーマンステスト
- [ ] セキュリティテスト
- [ ] ロードテスト
- [ ] E2Eテスト（Playwright等）
- [ ] コントラクトテスト
- [ ] ミューテーションテスト