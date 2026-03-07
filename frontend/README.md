# LoveTalk Frontend

恋愛相談SNS「LoveTalk」のフロントエンド

## アーキテクチャ

### ディレクトリ構成

- `app/`: Next.js App Router
  - `(auth)/`: 認証関連ページ
  - `(main)/`: メインアプリケーションページ
  - `components/`: Reactコンポーネント
    - `ui/`: 汎用UIコンポーネント
    - `layout/`: レイアウト用コンポーネント
    - `post/`: 投稿関連コンポーネント
    - `reply/`: リプライ関連コンポーネント
    - `timeline/`: タイムライン関連コンポーネント
    - `profile/`: プロフィール関連コンポーネント
  - `hooks/`: カスタムフック
  - `lib/`: ライブラリ設定
    - `supabase/`: Supabaseクライアント設定
    - `api/`: API連携（OpenAPI/Orval）
  - `providers/`: Contextプロバイダー
  - `types/`: TypeScript型定義

## 環境構築

### 必要要件

- Node.js 18+
- Yarn 4+

### セットアップ

1. 依存パッケージインストール
```bash
yarn install
```

2. 環境変数設定
```bash
cp .env.example .env.local
# .env.localを編集してSupabaseとAPIの接続情報を設定
```

3. 開発サーバー起動
```bash
yarn dev
```

## コマンド一覧

| コマンド | 説明 |
|---------|------|
| `yarn dev` | 開発サーバー起動 (http://localhost:3000) |
| `yarn build` | プロダクションビルド |
| `yarn start` | プロダクションサーバー起動 |
| `yarn lint` | ESLintによるコードチェック |
| `yarn fmt` | Prettierによるコードフォーマット |
| `yarn fmt:check` | フォーマットチェック |
| `yarn type-check` | TypeScript型チェック |
| `yarn gen:api` | OpenAPIからAPI クライアント生成 |

## 環境変数

| 変数名 | 説明 | 例 |
|--------|------|-----|
| `NEXT_PUBLIC_SUPABASE_URL` | SupabaseプロジェクトURL | https://xxxxx.supabase.co |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anonymous Key | eyJhbGci... |
| `NEXT_PUBLIC_API_URL` | バックエンドAPI URL | http://localhost:8000 |

## 開発フロー

1. バックエンドのOpenAPIスキーマ生成
```bash
cd ../backend && make gen-openapi
```

2. フロントエンドのAPIクライアント生成
```bash
yarn gen:api
```

3. 開発サーバー起動
```bash
yarn dev
```
