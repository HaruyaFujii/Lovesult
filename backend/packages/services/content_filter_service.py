from dataclasses import dataclass

from sqlalchemy.ext.asyncio import AsyncSession

from packages.repositories.banned_word_repository import BannedWordRepository


@dataclass
class FilterResult:
    is_safe: bool
    reason: str | None = None
    severity: str | None = None
    matched_words: list[str] = None


class ContentFilterService:
    def __init__(self, session: AsyncSession):
        self.repository = BannedWordRepository(session)

    async def check_content(self, content: str) -> FilterResult:
        """投稿内容をチェックして、不適切な内容が含まれているか判定"""
        banned_words = await self.repository.get_active_banned_words()

        found_words = []
        max_severity = None
        severity_order = {"high": 3, "medium": 2, "low": 1}

        for banned in banned_words:
            if banned.word.lower() in content.lower():
                found_words.append(banned)

                # 最も高い severity を記録
                if max_severity is None or severity_order.get(
                    banned.severity, 0
                ) > severity_order.get(max_severity, 0):
                    max_severity = banned.severity

        if not found_words:
            return FilterResult(is_safe=True)

        return FilterResult(
            is_safe=False,
            reason="inappropriate_content",
            severity=max_severity,
            matched_words=[w.word for w in found_words],  # ログ用、ユーザーには詳細を表示しない
        )
