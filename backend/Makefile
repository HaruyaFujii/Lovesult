.PHONY: dev lint fmt fix test migrate migrate-create gen-openapi install

# 依存インストール
install:
	source .venv/bin/activate && pip install -e ".[dev]"

# 開発サーバー起動
dev:
	source .venv/bin/activate && uvicorn api.main:app --reload --host 0.0.0.0 --port 8000

# Lint (ruff check + mypy)
lint:
	source .venv/bin/activate && ruff check api packages tests
	source .venv/bin/activate && mypy api packages

# Format
fmt:
	source .venv/bin/activate && ruff format api packages tests

# Auto fix
fix:
	source .venv/bin/activate && ruff check --fix api packages tests

# Test
test:
	source .venv/bin/activate && pytest tests -v

# Migration実行
migrate:
	source .venv/bin/activate && alembic upgrade head

# Migration作成
migrate-create:
	source .venv/bin/activate && alembic revision --autogenerate -m "$(name)"

# OpenAPI spec生成 → frontendへ出力
gen:
	source .venv/bin/activate && python generate_openapi.py
	@echo "OpenAPI schema generated successfully"