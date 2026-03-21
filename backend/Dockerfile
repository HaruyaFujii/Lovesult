# ============================================
# 本番用 Dockerfile
# Railway / Cloud Run 等でそのまま使用
# ============================================

# ---- ビルドステージ ----
FROM python:3.11-slim as builder

WORKDIR /workspace

# uvのインストール
RUN pip install --no-cache-dir uv

# backendディレクトリの依存関係ファイルをコピー
COPY ./backend/pyproject.toml /workspace/backend/pyproject.toml
COPY ./backend/uv.lock /workspace/backend/uv.lock

# 依存関係のインストール（uvを使用）
WORKDIR /workspace/backend
RUN uv sync --no-dev --frozen

# ---- 実行ステージ ----
FROM python:3.11-slim as runner

WORKDIR /app

# セキュリティ: 非rootユーザーで実行
RUN addgroup --system --gid 1001 appgroup \
    && adduser --system --uid 1001 --gid 1001 appuser

# 依存関係をビルドステージからコピー
COPY --from=builder /workspace/backend/.venv /app/.venv

# アプリケーションコード（backendディレクトリの内容のみ）
COPY --chown=appuser:appgroup ./backend /app

# 環境変数でPython実行環境を設定
ENV PATH="/app/.venv/bin:$PATH"

# 非rootユーザーに切り替え
USER appuser

# ポート
EXPOSE 8000

# ヘルスチェック
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/v1/health')" || exit 1

# 起動コマンド
CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000"]