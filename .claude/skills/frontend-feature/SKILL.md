---
name: frontend-feature
description: frontendに新しい画面・UI機能を追加する。App Routerのページ構成、React Queryフック、shadcn/uiコンポーネントの規約。既存画面の改修時も参照する。
---

## 配置ルール

- 新画面(認証済みユーザー向け): `app/(main)/{name}/page.tsx`
- 認証前画面(ログイン・登録など): `app/(auth)/{name}/page.tsx`
- 機能別コンポーネント: `app/components/{feature}/` (例: `post/`, `timeline/`, `profile/`)
- 共通コンポーネント: `app/components/common/`
- shadcn/ui プリミティブ: `app/components/ui/`

`app/(main)/` 配下のページは MainLayout が自動適用され、BottomNavigation・FAB・MobileHeader が提供される。ページ自身でこれらを重複実装しない。

## データフェッチ規約

Orval が生成した React Query フックは `app/lib/api/generated/endpoints/` にある。シンプルなフェッチはこれを直接使う。

**キャッシュ制御・楽観的更新が必要な場合**は `app/hooks/use-{feature}.ts` にラップする。`use-posts.ts` から抽出したパターン:

```typescript
// app/hooks/use-{feature}.ts
export function use{Feature}(params?: { limit?: number; cursor?: string }) {
  return useQuery({
    queryKey: ['{feature}s', params],  // 配列形式。第1要素がリソース名
    queryFn: async () => {
      const response = await customInstance<{ data: {Feature}Response }>(
        '/api/v1/{feature}s', { params }
      );
      return response.data;
    },
    staleTime: 2 * 60 * 1000,  // 2分
  });
}

export function useCreate{Feature}() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {Feature}Create) => { /* ... */ },
    onMutate: async (newData) => {
      // 1. 進行中クエリをキャンセル
      await queryClient.cancelQueries({ queryKey: ['{feature}s'] });
      // 2. 現在のデータを退避
      const previous = queryClient.getQueriesData({ queryKey: ['{feature}s'] });
      // 3. 楽観的に UI を更新(一時 ID は `temp-${Date.now()}`)
      queryClient.setQueriesData({ queryKey: ['{feature}s'] }, (old) => { /* ... */ });
      return { previous };
    },
    onError: (err, data, context) => {
      // ロールバック
      context?.previous.forEach(([key, val]) => queryClient.setQueryData(key, val));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['{feature}s'] });
    },
  });
}
```

`customInstance` は `@/lib/api/customInstance` からインポートする。Orval 生成ファイルへの手動 import 追加は不要(フック内で直接 customInstance を使う)。

## 認証

```typescript
import { useAuth } from '@/providers/AuthProvider';
const { user, session } = useAuth(); // 認証状態の確認・保護

import { useCurrentUser } from '@/hooks/use-user';
const { data: currentUser } = useCurrentUser(); // ログインユーザー情報(API側プロフィール)
```

401 エラーは `customInstance` が自動的にサインアウト → `/login` へリダイレクトする。フック側で 401 を個別にハンドリングしない。

## UIコンポーネント

shadcn/ui の style は `new-york`、baseColor は `neutral`、CSS Variables 有効、アイコンは `lucide`。

新しい UI プリミティブが必要な場合:
```
npx shadcn@latest add {component}
```
追加されたファイルは `app/components/ui/` に配置される。

ページは全てモバイルファースト。スクロール可能なリストには `PullToRefreshContainer` を使い、`onRefresh` で `query.refetch()` を呼ぶ(`app/components/layout/PullToRefreshContainer.tsx`)。

全ページ先頭に `'use client';` ディレクティブを置く(App Router だが実質全ページ Client Component)。

## 仕上げ

```bash
yarn lint && yarn type-check  # max-warnings 0 なので警告も全て解消する
yarn fmt                      # コミット前に必ず実行
yarn dev                      # ブラウザで動作確認
```

## 注意点

- `app/lib/api/generated/` は Orval 自動生成ファイル。**手編集禁止**。型や関数名を変更したい場合は backend-feature + sync-api スキルで再生成する
- `yarn lint` は `max-warnings 0` で実行されるため、warning も全て修正が必要
- backend の新 API が必要なら backend-feature スキルで実装し、sync-api スキルで型同期してから frontend を実装する
- `queryKey` は必ず配列形式にする。`invalidateQueries` でプレフィックス一致を活用できる(`{ queryKey: ['posts'] }` で `['posts', params]` も無効化される)
- 楽観的更新の一時 ID は `temp-${Date.now()}` を使い、`_optimistic: true` フラグを付けると表示側での条件分岐が容易になる
