#!/usr/bin/env python
"""OpenAPI スキーマ生成スクリプト"""

import json
import sys
from pathlib import Path

# プロジェクトルートをパスに追加
sys.path.insert(0, str(Path(__file__).parent))

from api.main import app

# OpenAPIスキーマを生成
openapi_schema = app.openapi()

# JSONとして出力
output_path = Path(__file__).parent.parent / "frontend" / "app" / "lib" / "api" / "openapi.json"
output_path.parent.mkdir(parents=True, exist_ok=True)

with open(output_path, "w", encoding="utf-8") as f:
    json.dump(openapi_schema, f, indent=2, ensure_ascii=False)

print(f"OpenAPI schema generated: {output_path}")