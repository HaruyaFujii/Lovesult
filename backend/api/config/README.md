# Configuration

アプリケーション設定管理

## ファイル構成

- **settings.py** - 環境変数と設定クラス

## Settings クラス

Pydantic Settingsを使用した設定管理：

- Supabase設定（URL、Keys、JWT Secret）
- データベース接続設定
- アプリケーション設定（環境、デバッグモード、CORS）

## 環境変数

`.env`ファイルから自動読み込み：

```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
SUPABASE_JWT_SECRET=your-jwt-secret
DATABASE_URL=postgresql+asyncpg://...
ENV=development
DEBUG=true
CORS_ORIGINS=http://localhost:3000
```

## 使用方法

```python
from api.config import get_settings

settings = get_settings()
```