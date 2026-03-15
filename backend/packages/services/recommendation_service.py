from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from packages.repositories.personality_repository import PersonalityRepository

# 性格タイプ定義
PERSONALITY_TYPES = {
    "romantic": {
        "name": "ロマンチスト",
        "description": "理想の恋愛を追い求めるタイプ。ドラマチックな展開や特別な瞬間を大切にします。",
        "emoji": "💕",
        "color": "#FF6B9D",
        "compatible_with": ["caring", "passionate"],
    },
    "caring": {
        "name": "献身タイプ",
        "description": "相手を支えることに喜びを感じるタイプ。思いやりと気配りが得意です。",
        "emoji": "🤗",
        "color": "#4ECDC4",
        "compatible_with": ["romantic", "independent"],
    },
    "passionate": {
        "name": "情熱タイプ",
        "description": "熱い恋愛を好むタイプ。感情豊かで、愛情表現がストレートです。",
        "emoji": "🔥",
        "color": "#FF6B6B",
        "compatible_with": ["romantic", "adventurous"],
    },
    "independent": {
        "name": "自立タイプ",
        "description": "適度な距離感を大切にするタイプ。お互いの時間と空間を尊重します。",
        "emoji": "🌟",
        "color": "#A78BFA",
        "compatible_with": ["caring", "rational"],
    },
    "adventurous": {
        "name": "冒険タイプ",
        "description": "新しい体験を恋人と共有したいタイプ。刺激と変化を楽しみます。",
        "emoji": "✈️",
        "color": "#F59E0B",
        "compatible_with": ["passionate", "rational"],
    },
    "rational": {
        "name": "堅実タイプ",
        "description": "安定した関係を築きたいタイプ。計画性があり、将来を見据えます。",
        "emoji": "🏠",
        "color": "#10B981",
        "compatible_with": ["independent", "adventurous"],
    },
}


class RecommendationService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.personality_repo = PersonalityRepository(session)

    async def get_recommended_users(
        self,
        user_id: UUID,
        limit: int = 10,
    ) -> list[dict]:
        """相性の良いユーザーを取得"""
        # 自分の診断結果を取得
        my_result = await self.personality_repo.get_by_user_id(user_id)
        if not my_result:
            return []

        my_type = my_result.primary_type
        compatible_types = PERSONALITY_TYPES.get(my_type, {}).get("compatible_with", [])

        # 相性の良いタイプのユーザーを取得
        users = await self.personality_repo.get_users_by_personality_type(
            personality_types=compatible_types,
            exclude_user_id=user_id,
            limit=limit,
        )

        return [
            {
                "id": user.id,
                "nickname": user.nickname,
                "avatar_url": user.avatar_url,
                "personality_type": user.personality_type,
                "personality_emoji": PERSONALITY_TYPES.get(user.personality_type, {}).get(
                    "emoji", ""
                ),
                "compatibility_score": self._calculate_compatibility(
                    my_type, user.personality_type
                ),
            }
            for user in users
        ]

    def _calculate_compatibility(self, my_type: str, their_type: str) -> float:
        """相性スコアを計算（0.0〜1.0）"""
        compatible_types = PERSONALITY_TYPES.get(my_type, {}).get("compatible_with", [])

        if their_type in compatible_types:
            return 1.0
        elif their_type == my_type:
            return 0.7
        else:
            return 0.4
