# Health Feature

ヘルスチェック機能

## エンドポイント

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/v1/health` | ヘルスチェック | - |

## レスポンス

```json
{
  "status": "healthy",
  "service": "LoveTalk API",
  "version": "0.1.0"
}
```

## 用途

- アプリケーションの死活監視
- デプロイ後の動作確認
- ロードバランサーのヘルスチェック
- 監視ツールからのポーリング