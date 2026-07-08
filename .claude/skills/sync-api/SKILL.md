---
name: sync-api
description: backendのAPI(router/schemas)変更後にOpenAPIスキーマとOrval製TypeScriptクライアントを再生成してfrontendと型同期する。frontendでAPI型エラーが出た時にも使う。
---

## 手順

1. **OpenAPI スキーマを生成する**

   ```bash
   cd backend && make gen
   ```

   `generate_openapi.py` が `app.openapi()` を直接出力する。backend サーバーの起動は不要。
   出力先: `frontend/app/lib/api/openapi.json`

2. **TypeScript クライアントを再生成する**

   ```bash
   cd frontend && yarn gen
   ```

   Orval が `orval.config.ts` の設定に従い以下を再生成する(生成後 Prettier が自動実行される):
   - `app/lib/api/generated/endpoints/` — React Query フック (tags-split: 機能タグ毎にディレクトリ分割)
   - `app/lib/api/generated/models/` — 型定義

3. **型チェックで不整合を検出する**

   ```bash
   yarn type-check
   ```

   エラーが出た箇所は生成物の型に合わせて呼び出し元のコードを修正する。

## 注意点

- `app/lib/api/generated/` 配下と `openapi.json` は**手編集禁止**。再生成で上書きされる
- tsconfig でも `generated/` は exclude 済みのため、型チェック対象外
- backend サーバーの起動は不要。スクリプトが直接 `app.openapi()` を呼び出す
- フックは react-query 形式で生成される。タグ毎にサブディレクトリに分割されるため、import パスはタグ名に依存する
