.PHONY: dev lint fmt fix test migrate migrate-create gen-openapi install

# 依存インストール
install:
	uv sync --dev

# 開発サーバー起動
dev:
	uv run uvicorn api.main:app --reload --host 0.0.0.0 --port 8000

# Lint (ruff check + mypy)
lint:
	uv run --with ruff ruff check api packages tests
	uv run --with mypy mypy api packages/models packages/services packages/db/session.py

# Format
fmt:
	uv run --with ruff ruff format api packages tests

# Auto fix
fix:
	uv run --with ruff ruff check --fix api packages tests

# Test
test:
	uv run --with pytest --with pytest-asyncio pytest tests -v

# Migration実行
migrate:
	uv run alembic upgrade head

# Migration作成
migrate-create:
	uv run alembic revision --autogenerate -m "$(name)"

# OpenAPI spec生成 → frontendへ出力
gen:
	uv run python generate_openapi.py
	@echo "OpenAPI schema generated successfully"