# Replies Feature

リプライ機能のAPI実装

## エンドポイント

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/v1/posts/{post_id}/replies` | リプライ一覧取得 | - |
| POST | `/api/v1/posts/{post_id}/replies` | リプライ作成 | ✓ |
| DELETE | `/api/v1/replies/{reply_id}` | リプライ削除 | ✓ |

## スキーマ

### ReplyCreate (リクエスト)
```json
{
  "content": "string (1-300文字)"
}
```

### ReplyResponse (レスポンス)
```json
{
  "id": "uuid",
  "post_id": "uuid",
  "user_id": "uuid",
  "content": "string",
  "created_at": "datetime",
  "user": {
    "id": "uuid",
    "nickname": "string",
    ...
  }
}
```

### RepliesResponse
```json
{
  "replies": [ReplyResponse]
}
```

## ビジネスロジック

- リプライはネストなし（1階層のみ）
- 削除は投稿者本人のみ可能
- 投稿作成は認証必須
- 作成日時順でソート表示