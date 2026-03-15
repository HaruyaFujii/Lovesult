from typing import Dict, List, Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from packages.services.personality_service import PersonalityService
from packages.services.recommendation_service import RecommendationService
from .questions import PERSONALITY_TYPES, QUESTIONS
from .schemas import (
    AnswerSubmit,
    PersonalityResultResponse,
    PersonalityType,
    QuestionsResponse,
    Question,
    RecommendedUsersResponse,
)


class PersonalityUseCase:
    def __init__(self, session: AsyncSession):
        self.personality_service = PersonalityService(session)
        self.recommendation_service = RecommendationService(session)

    def get_questions(self) -> QuestionsResponse:
        """診断質問を取得"""
        questions = [Question(**q) for q in QUESTIONS]
        return QuestionsResponse(questions=questions)

    async def submit_answers(
        self,
        user_id: UUID,
        data: AnswerSubmit,
    ) -> PersonalityResultResponse:
        """診断回答を送信して結果を取得"""
        # スコア計算
        scores = self._calculate_scores(data.answers)

        # プライマリ・セカンダリタイプを決定
        sorted_types = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        primary_type = sorted_types[0][0]
        secondary_type = sorted_types[1][0] if len(sorted_types) > 1 and sorted_types[1][1] > 0 else None

        # 結果を保存
        result = await self.personality_service.save_result(
            user_id=user_id,
            primary_type=primary_type,
            secondary_type=secondary_type,
            scores=scores,
            answers=data.answers,
        )

        return PersonalityResultResponse(
            primary_type=self._get_type_info(primary_type),
            secondary_type=self._get_type_info(secondary_type) if secondary_type else None,
            scores=scores,
            created_at=result.created_at,
        )

    async def get_my_result(self, user_id: UUID) -> Optional[PersonalityResultResponse]:
        """自分の診断結果を取得"""
        result = await self.personality_service.get_result(user_id)
        if not result:
            return None

        return PersonalityResultResponse(
            primary_type=self._get_type_info(result.primary_type),
            secondary_type=self._get_type_info(result.secondary_type) if result.secondary_type else None,
            scores=result.scores,
            created_at=result.created_at,
        )

    async def get_user_result(self, user_id: UUID) -> Optional[PersonalityResultResponse]:
        """指定ユーザーの診断結果を取得（他人の結果も取得可能）"""
        result = await self.personality_service.get_result(user_id)
        if not result:
            return None

        return PersonalityResultResponse(
            primary_type=self._get_type_info(result.primary_type),
            secondary_type=self._get_type_info(result.secondary_type) if result.secondary_type else None,
            scores=result.scores,
            created_at=result.created_at,
        )

    async def get_recommended_users(
        self,
        user_id: UUID,
        limit: int = 10,
    ) -> RecommendedUsersResponse:
        """おすすめユーザーを取得"""
        users = await self.recommendation_service.get_recommended_users(
            user_id=user_id,
            limit=limit,
        )
        return RecommendedUsersResponse(users=users)

    def _calculate_scores(self, answers: List[int]) -> Dict[str, int]:
        """回答からスコアを計算"""
        scores = {key: 0 for key in PERSONALITY_TYPES.keys()}

        for q_idx, option_idx in enumerate(answers):
            if q_idx >= len(QUESTIONS) or option_idx >= len(QUESTIONS[q_idx]["options"]):
                continue

            question = QUESTIONS[q_idx]
            option = question["options"][option_idx]
            for type_key, score in option["scores"].items():
                scores[type_key] += score

        return scores

    def _get_type_info(self, type_key: str) -> PersonalityType:
        """タイプ情報を取得"""
        info = PERSONALITY_TYPES[type_key]
        return PersonalityType(
            key=type_key,
            **info,
        )