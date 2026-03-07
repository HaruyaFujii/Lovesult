# Posts Feature

投稿管理とタイムライン機能のAPI実装

## エンドポイント

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/v1/posts` | タイムライン取得 | Optional |
| POST | `/api/v1/posts` | 投稿作成 | ✓ |
| GET | `/api/v1/posts/{post_id}` | 投稿詳細取得 | - |
| PUT | `/api/v1/posts/{post_id}` | 投稿編集 | ✓ |
| DELETE | `/api/v1/posts/{post_id}` | 投稿削除 | ✓ |

## クエリパラメータ

### GET /posts
- `status`: ステータスフィルター (in_love | heartbroken | seeking)
- `cursor`: ページネーションカーソル（ISO8601形式）
- `limit`: 取得件数（1-100、デフォルト20）

## タイムラインアルゴリズム

ログインユーザーの場合：
- 同じステータスの投稿: 80%
- 他のステータスの投稿: 20%

未ログインユーザーの場合：
- 全投稿を新着順で表示

## スキーマ

### PostCreate (リクエスト)
```json
{
  "content": "string (1-500文字)"
}
```

### PostResponse (レスポンス)
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "content": "string",
  "created_at": "datetime",
  "updated_at": "datetime",
  "user": {
    "id": "uuid",
    "nickname": "string",
    "status": "string",
    ...
  }
}
```

### TimelineResponse
```json
{
  "posts": [PostResponse],
  "next_cursor": "string | null"
}
```

## 権限管理

- 編集・削除は投稿者本人のみ可能
- 投稿作成は認証必須