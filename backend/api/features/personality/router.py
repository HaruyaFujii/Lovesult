from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from api.core.dependencies import get_current_user_id, get_db
from .schemas import (
    AnswerSubmit,
    PersonalityResultResponse,
    QuestionsResponse,
    RecommendedUsersResponse,
)
from .usecase import PersonalityUseCase

router = APIRouter(prefix="/personality", tags=["personality"])


@router.get("/questions", response_model=QuestionsResponse)
async def get_questions() -> QuestionsResponse:
    """診断質問を取得"""
    usecase = PersonalityUseCase(None)  # sessionは不要
    return usecase.get_questions()


@router.post("/submit", response_model=PersonalityResultResponse)
async def submit_answers(
    data: AnswerSubmit,
    current_user_id: UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> PersonalityResultResponse:
    """診断回答を送信"""
    usecase = PersonalityUseCase(db)
    return await usecase.submit_answers(
        user_id=current_user_id,
        data=data,
    )


@router.get("/me", response_model=PersonalityResultResponse)
async def get_my_result(
    current_user_id: UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> PersonalityResultResponse:
    """自分の診断結果を取得"""
    usecase = PersonalityUseCase(db)
    result = await usecase.get_my_result(current_user_id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Personality result not found. Please take the quiz first.",
        )
    return result


@router.get("/users/{user_id}", response_model=Optional[PersonalityResultResponse])
async def get_user_result(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> Optional[PersonalityResultResponse]:
    """指定ユーザーの診断結果を取得"""
    usecase = PersonalityUseCase(db)
    return await usecase.get_user_result(user_id)


@router.get("/recommended-users", response_model=RecommendedUsersResponse)
async def get_recommended_users(
    limit: int = Query(10, ge=1, le=50),
    current_user_id: UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> RecommendedUsersResponse:
    """おすすめユーザーを取得"""
    usecase = PersonalityUseCase(db)
    return await usecase.get_recommended_users(
        user_id=current_user_id,
        limit=limit,
    )