from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from api.core.dependencies import get_current_user_id, get_db

from .schemas import ReportCreate, ReportListResponse, ReportResponse
from .usecase import ReportUseCase

router = APIRouter(prefix="/reports", tags=["reports"])


@router.post("", response_model=ReportResponse, operation_id="createReport")
async def create_report(
    report_data: ReportCreate,
    current_user_id: UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> ReportResponse:
    """コンテンツを報告する"""
    usecase = ReportUseCase(db)
    try:
        report = await usecase.create_report(
            reporter_id=current_user_id,
            target_type=report_data.target_type,
            target_id=report_data.target_id,
            report_type=report_data.report_type,
            reason=report_data.reason,
        )
        return report
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e


@router.get("/{report_id}", response_model=ReportResponse, operation_id="getReport")
async def get_report(
    report_id: UUID,
    current_user_id: UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> ReportResponse:
    """報告の詳細を取得する"""
    usecase = ReportUseCase(db)
    report = await usecase.get_report(report_id)

    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found",
        )

    # 自分の報告のみ取得可能
    if report.reporter_id != current_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view your own reports",
        )

    return report


@router.get("/admin/pending", response_model=ReportListResponse, operation_id="getPendingReports")
async def get_pending_reports(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
) -> ReportListResponse:
    """保留中の報告一覧を取得する（管理者用）"""
    # TODO: 管理者権限チェックを追加
    usecase = ReportUseCase(db)
    reports, total, has_more = await usecase.get_pending_reports(limit, offset)

    return ReportListResponse(
        reports=reports,
        total=total,
        has_more=has_more,
    )
