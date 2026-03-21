# API Client

## 現在の実装

現在は直接fetchを使用してAPIを呼び出しています：
- `customInstance.ts` - 認証ヘッダー付きのfetchラッパー

## Orvalを使用する場合（将来的な実装）

1. BackendでOpenAPIスキーマ生成
```bash
cd backend
make gen-openapi
```

2. FrontendでAPIクライアント生成
```bash
cd frontend
yarn gen:api
```

これにより`app/lib/api/generated/`配下に型安全なAPIクライアントが生成されます。

## 注意事項

- APIのエンドポイントやスキーマを変更した場合は、必ず再生成が必要
- 生成されたコードは手動で編集しない（再生成時に上書きされる）