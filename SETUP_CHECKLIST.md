# LoveTalk セットアップチェックリスト

このチェックリストに従って、アプリケーションを起動してください。

## 📋 必須準備

### 1. Supabaseアカウントとプロジェクト作成

- [ ] [Supabase](https://supabase.com)でアカウントを作成
- [ ] 新規プロジェクトを作成（リージョン: Tokyo推奨）
- [ ] プロジェクト作成完了を待つ（約2分）

### 2. Supabase設定値の取得

プロジェクトダッシュボードから以下を取得：

- [ ] **Project URL**: Settings > API > Project URL
  ```
  https://YOUR_PROJECT_ID.supabase.co
  ```

- [ ] **Anon Key**: Settings > API > Project API keys > anon
  ```
  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  ```

- [ ] **Service Role Key**: Settings > API > Project API keys > service_role
  ```
  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  ```

- [ ] **JWT Secret**: Settings > API > JWT Settings > JWT Secret
  ```
  your-super-secret-jwt-token-with-at-least-32-characters-long
  ```

- [ ] **Database URL**: Settings > Database > Connection string > Transaction mode
  ```
  postgresql://postgres.YOUR_PROJECT_ID:PASSWORD@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres
  ```
  ⚠️ asyncpgを使うため、URLを `postgresql+asyncpg://` に変更する必要があります

### 3. Supabase認証設定

- [ ] Authentication > Providers > Email を有効化
- [ ] Authentication > URL Configuration で設定：
  - Site URL: `http://localhost:3000`
  - Redirect URLs に追加: `http://localhost:3000/**`

## 🔧 ローカル環境セットアップ

### 4. Backend設定

```bash
cd backend
```

- [ ] Python 3.11がインストールされている
  ```bash
  python --version  # 3.11.x であることを確認
  ```

- [ ] 仮想環境作成と有効化
  ```bash
  python -m venv venv
  source venv/bin/activate  # Windows: venv\Scripts\activate
  ```

- [ ] `.env`ファイル作成
  ```bash
  cp .env.example .env
  ```

- [ ] `.env`を編集して、取得した値を設定：
  ```env
  SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
  SUPABASE_ANON_KEY=eyJhbGci...（取得したanon key）
  SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...（取得したservice_role key）
  SUPABASE_JWT_SECRET=your-jwt-secret（取得したJWT Secret）
  DATABASE_URL=postgresql+asyncpg://postgres.YOUR_PROJECT_ID:PASSWORD@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres
  ENV=development
  DEBUG=true
  CORS_ORIGINS=http://localhost:3000
  ```

- [ ] 依存関係インストール
  ```bash
  pip install -e ".[dev]"
  ```

- [ ] データベースマイグレーション実行
  ```bash
  alembic upgrade head
  ```

  ⚠️ エラーが出る場合は、DATABASE_URLの末尾に `?sslmode=require` を追加

- [ ] 開発サーバー起動
  ```bash
  make dev
  # または
  uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
  ```

- [ ] APIドキュメントにアクセスできることを確認
  ```
  http://localhost:8000/docs
  ```

### 5. Frontend設定

新しいターミナルで：

```bash
cd frontend
```

- [ ] Node.js 18以上がインストールされている
  ```bash
  node --version  # v18.x.x 以上であることを確認
  ```

- [ ] `.env.local`ファイル作成
  ```bash
  cp .env.example .env.local
  ```

- [ ] `.env.local`を編集：
  ```env
  NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...（anon keyと同じ）
  NEXT_PUBLIC_API_URL=http://localhost:8000
  ```

- [ ] 依存関係インストール
  ```bash
  yarn install
  ```

- [ ] 開発サーバー起動
  ```bash
  yarn dev
  ```

- [ ] ブラウザでアクセス
  ```
  http://localhost:3000
  ```

## ✅ 動作確認

1. **新規登録**
   - [ ] `/signup`でアカウント作成
   - [ ] メールアドレスとパスワードで登録
   - [ ] プロフィール設定画面に遷移

2. **プロフィール設定**
   - [ ] ニックネーム入力
   - [ ] ステータス選択（恋愛中/失恋中/探し中）
   - [ ] 保存してタイムラインへ

3. **投稿機能**
   - [ ] 新規投稿作成
   - [ ] 投稿の編集
   - [ ] 投稿の削除

4. **リプライ機能**
   - [ ] 投稿詳細ページでリプライ
   - [ ] リプライの削除

## 🚨 トラブルシューティング

### よくあるエラーと対処法

1. **alembic upgrade head でエラー**
   ```
   sqlalchemy.exc.OperationalError: (asyncpg.exceptions.InvalidPasswordError)
   ```
   → DATABASE_URLのパスワードが正しいか確認
   → `?sslmode=require`を追加してみる

2. **401 Unauthorized エラー**
   ```
   Invalid authentication credentials
   ```
   → SUPABASE_JWT_SECRETが正しいか確認
   → Anon Keyが正しいか確認

3. **CORS エラー**
   ```
   Access to fetch at 'http://localhost:8000' from origin 'http://localhost:3000' has been blocked
   ```
   → Backend の.envで`CORS_ORIGINS=http://localhost:3000`が設定されているか確認
   → Backendサーバーを再起動

4. **Supabase認証エラー**
   ```
   Auth session missing
   ```
   → Supabaseダッシュボードで Email Provider が有効になっているか確認

## 📝 最終確認

- [ ] Backend が http://localhost:8000 で起動している
- [ ] Frontend が http://localhost:3000 で起動している
- [ ] ユーザー登録・ログインができる
- [ ] 投稿の作成・編集・削除ができる
- [ ] リプライの送信・削除ができる

すべて完了したら、LoveTalkの利用を開始できます！🎉