# Lovesult Frontend

Next.js 15 + TypeScript + Tailwind CSS によるマッチングSNSフロントエンド

## 🏗 アーキテクチャ

### 技術スタック
- **Framework**: Next.js 15.2.3 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 3 + shadcn/ui
- **State Management**: TanStack Query v5 + Zustand
- **Authentication**: Supabase Auth (JWT)
- **API Client**: Orval (OpenAPI → TypeScript自動生成)
- **Package Manager**: Yarn 4 (Berry)

### ディレクトリ構成

```
frontend/
├── app/                      # App Router
│   ├── (auth)/              # 認証ページ群
│   │   ├── signin/          # サインイン
│   │   ├── signup/          # サインアップ
│   │   └── reset-password/  # パスワードリセット
│   ├── (main)/              # メインアプリケーション
│   │   ├── timeline/        # タイムライン
│   │   ├── post/[id]/       # 投稿詳細
│   │   ├── profile/         # プロフィール
│   │   ├── search/          # 検索
│   │   ├── messages/        # DM機能
│   │   ├── notifications/   # 通知
│   │   ├── personality/     # 性格診断
│   │   └── settings/        # 設定
│   ├── components/          # UIコンポーネント
│   │   ├── ui/              # shadcn/uiベースコンポーネント
│   │   ├── layout/          # レイアウト (BottomNavigation, FAB等)
│   │   ├── post/            # 投稿関連 (PostCard, CreatePostModal)
│   │   ├── reply/           # リプライ関連 (ReplyCard, ReplyForm)
│   │   └── ContentCard.tsx  # 汎用コンテンツカード
│   ├── hooks/               # カスタムフック
│   │   ├── useAuth.ts       # 認証
│   │   ├── use-posts.ts     # 投稿管理
│   │   ├── use-replies.ts   # リプライ管理
│   │   ├── use-likes.ts     # いいね機能
│   │   ├── use-dm.ts        # ダイレクトメッセージ
│   │   ├── use-personality.ts # 性格診断
│   │   └── usePullToRefresh.ts # プルトゥリフレッシュ
│   ├── lib/                 # ライブラリ設定
│   │   ├── supabase/        # Supabaseクライアント
│   │   └── api/             # API設定
│   │       ├── generated/   # Orval自動生成コード
│   │       └── customInstance.ts # Axiosカスタムインスタンス
│   ├── providers/           # Context Providers
│   └── types/               # TypeScript型定義
├── public/                  # 静的アセット
├── orval.config.ts          # Orval設定
├── package.json             # 依存関係
└── .env.local               # 環境変数
```

## 🚀 セットアップ

### 必要要件
- Node.js 20+
- Yarn 4.5.3+
- 動作中のバックエンドサーバー (http://localhost:8000)

### インストール手順

1. **依存パッケージインストール**
```bash
yarn install
```

2. **環境変数設定**
```bash
cp .env.example .env.local
```

`.env.local`を編集:
```env
# Supabase設定
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...

# API設定
NEXT_PUBLIC_API_URL=http://localhost:8000
```

3. **APIクライアント生成**
```bash
# バックエンドが起動していることを確認してから実行
yarn gen
```

4. **開発サーバー起動**
```bash
yarn dev
```

アプリケーション: http://localhost:3000

## 📋 開発コマンド

| コマンド | 説明 |
|---------|------|
| `yarn dev` | 開発サーバー起動 (ホットリロード有効) |
| `yarn build` | プロダクションビルド |
| `yarn start` | プロダクションサーバー起動 |
| `yarn lint` | ESLintによるコードチェック |
| `yarn fmt` | Prettierによるコードフォーマット |
| `yarn fmt:check` | フォーマットチェック (CI用) |
| `yarn type-check` | TypeScript型チェック |
| `yarn gen` | OpenAPIからAPIクライアント生成 (Orval) |

## 🔧 主要機能

### 実装済み機能

#### 認証・ユーザー管理
- ✅ メール/パスワード認証 (Supabase Auth)
- ✅ プロフィール編集 (アバター、ニックネーム、ステータス等)
- ✅ 恋愛ステータス表示 (IN_LOVE / HEARTBROKEN / SEEKING)

#### 投稿機能
- ✅ 投稿の作成・編集・削除
- ✅ リプライ機能 (無限階層ネスト対応)
- ✅ いいね機能 (投稿・リプライ両対応)
- ✅ リアルタイム更新 (楽観的UI)

#### タイムライン
- ✅ 無限スクロール
- ✅ プルトゥリフレッシュ (モバイル)
- ✅ ステータス優先表示アルゴリズム
- ✅ フォロー中タイムライン

#### DM機能
- ✅ 1対1メッセージング
- ✅ 会話一覧・未読数表示
- ✅ 既読管理
- ✅ リアルタイム更新 (ポーリング)

#### 性格診断
- ✅ 20問の診断テスト
- ✅ 16タイプ性格分類 (MBTI風)
- ✅ 相性の良いユーザーレコメンデーション

#### UI/UX
- ✅ レスポンシブデザイン (モバイルファースト)
- ✅ ボトムナビゲーション
- ✅ FAB (Floating Action Button)
- ✅ スワイプバック (iOS風)
- ✅ スケルトンローディング

## 🎨 UIコンポーネント

### shadcn/ui Components
- Button, Card, Dialog, Form
- Avatar, Badge, Label
- Input, Textarea, Select
- Tabs, ScrollArea
- Toast, Alert

### カスタムコンポーネント
- `ContentCard`: 投稿・リプライ表示用汎用カード
- `PostCard`: 投稿専用カード (いいね、リプライボタン付き)
- `ReplyCard`: リプライ表示カード (ネスト対応)
- `BottomNavigation`: モバイル用ナビゲーション
- `FloatingActionButton`: 投稿作成FAB
- `AvatarUpload`: アバターアップロードコンポーネント

## 🔄 状態管理

### TanStack Query
- サーバー状態の管理
- 楽観的更新
- キャッシュ管理
- 自動リフェッチ

```typescript
// 使用例: use-posts.ts
const { data, isLoading, refetch } = useQuery({
  queryKey: ['posts', filters],
  queryFn: fetchPosts,
  staleTime: 0,
  refetchOnMount: 'always',
});
```

### Zustand
- クライアント状態の管理
- 認証状態
- UI状態 (モーダル、サイドバー等)

## 🔐 認証フロー

1. **サインアップ/サインイン**
   - Supabase Authでメール/パスワード認証
   - JWTトークン自動管理

2. **APIリクエスト**
   - Axiosインターセプターで自動的にBearerトークン付与
   - トークン期限切れ時の自動更新

3. **保護されたルート**
   - middlewareでの認証チェック
   - 未認証時は/signinへリダイレクト

## 🐛 トラブルシューティング

### よくある問題

1. **APIクライアント生成エラー**
```bash
# バックエンドが起動していることを確認
cd ../backend && make dev

# 再度生成
yarn gen
```

2. **認証エラー**
- Supabase URLとAnon Keyが正しいか確認
- バックエンドのCORS設定を確認

3. **型エラー**
```bash
# 型チェック実行
yarn type-check

# APIスキーマが更新された場合
yarn gen
```

4. **ビルドエラー**
```bash
# キャッシュクリア
rm -rf .next
yarn build
```

## 🚀 デプロイ

### Vercel
```bash
# ビルド
yarn build

# 環境変数設定
# Vercelダッシュボードで設定
```

### Docker
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN yarn install --immutable
RUN yarn build
CMD ["yarn", "start"]
```

## 📝 開発ガイドライン

### コード規約
- ESLint + Prettierの設定に従う
- コンポーネントはPascalCase
- フック、ユーティリティはcamelCase
- 型定義は必須 (no any)

### コミット規約
```
feat: 新機能追加
fix: バグ修正
refactor: リファクタリング
style: スタイル調整
docs: ドキュメント更新
test: テスト追加・修正
chore: その他のタスク
```

### パフォーマンス最適化
- 画像最適化 (next/image使用)
- コード分割 (dynamic import)
- メモ化 (useMemo, useCallback)
- 仮想スクロール (大量データ表示時)

## 📄 ライセンス

プロプライエタリ - 無断での使用・複製・配布を禁止します