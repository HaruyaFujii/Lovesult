# Users Feature

ユーザー管理機能のAPI実装

## エンドポイント

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/v1/users/me` | 自分のプロフィール取得 | ✓ |
| PUT | `/api/v1/users/me` | プロフィール更新 | ✓ |
| GET | `/api/v1/users/{user_id}` | 他ユーザーのプロフィール取得 | - |

## スキーマ

### UserUpdate (リクエスト)
```json
{
  "nickname": "string",
  "status": "in_love | heartbroken | seeking",
  "gender": "male | female | other | private",
  "age_range": "10s | 20s | 30s | 40s | 50s_plus",
  "bio": "string (optional)"
}
```

### UserResponse (レスポンス)
```json
{
  "id": "uuid",
  "email": "string",
  "nickname": "string",
  "status": "string",
  "gender": "string",
  "age_range": "string",
  "bio": "string",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

## ビジネスロジック

- 初回ログイン時に自動でユーザーレコード作成
- プロフィール更新は本人のみ可能
- メールアドレスは変更不可（Supabase Auth管理）