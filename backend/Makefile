.PHONY: dev lint fmt fix test migrate migrate-create gen-openapi install

# 依存インストール
install:
	pip install -e ".[dev]"

# 開発サーバー起動
dev:
	uvicorn api.main:app --reload --host 0.0.0.0 --port 8000

# Lint (ruff check + mypy)
lint:
	ruff check api packages tests
	mypy api packages

# Format
fmt:
	ruff format api packages tests

# Auto fix
fix:
	ruff check --fix api packages tests

# Test
test:
	pytest tests -v

# Migration実行
migrate:
	alembic upgrade head

# Migration作成
migrate-create:
	alembic revision --autogenerate -m "$(name)"

# OpenAPI spec生成 → frontendへ出力
gen-openapi:
	python generate_openapi.py
	@echo "OpenAPI schema generated successfully"