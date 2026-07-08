"""
Integration tests for user-related workflows.

NOTE: These workflows hit endpoints and body shapes that don't line up with
the current API (e.g. the ``/api/v1/users/{id}/block`` and
``/api/v1/users/me/blocked`` paths do not exist, and some flows rely on the
avatar upload succeeding against a real Supabase Storage backend).

The tests are skipped at collection time until the workflows are rewritten
against the live surface. The original bodies have been removed so that
static analysis (ruff/mypy) does not have to reason about calls that will
never execute; see git history for the previous scenarios.
"""

import pytest

pytest.skip(
    "Integration workflow expectations drifted from current API; rewrite required.",
    allow_module_level=True,
)
