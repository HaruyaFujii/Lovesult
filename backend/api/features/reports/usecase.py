from uuid import UUID
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from packages.models.report import Report, ReportType, ReportStatus
from packages.services.report_service import ReportService
from .schemas import ReportResponse


class ReportUseCase:
    """報告ユースケースクラス"""

    def __init__(self, session: AsyncSession):
        self.session = session
        self.report_service = ReportService(session)

    async def create_report(
        self,
        reporter_id: UUID,
        target_type: str,
        target_id: UUID,
        report_type: ReportType,
        reason: str,
    ) -> ReportResponse:
        """報告を作成する"""
        report = await self.report_service.create_report(
            reporter_id=reporter_id,
            report_type=report_type,
            reason=reason,
            target_type=target_type,
            target_id=target_id,
        )

        return ReportResponse.model_validate(report)

    async def get_report(self, report_id: UUID) -> Optional[ReportResponse]:
        """報告を取得する"""
        report = await self.report_service.get_report(report_id)
        if not report:
            return None

        return ReportResponse.model_validate(report)

    async def get_pending_reports(
        self,
        limit: int = 20,
        offset: int = 0
    ) -> tuple[list[ReportResponse], int, bool]:
        """保留中の報告を取得する"""
        from packages.repositories.report_repository import ReportRepository

        repository = ReportRepository(self.session)

        # 保留中の報告を取得
        reports = await repository.get_reports_by_status(
            status=ReportStatus.PENDING,
            limit=limit + 1,  # has_moreを判定するため
            offset=offset
        )

        has_more = len(reports) > limit
        if has_more:
            reports = reports[:limit]

        # レスポンスに変換
        response_reports = [
            ReportResponse.model_validate(report)
            for report in reports
        ]

        # 総数を取得
        total = await repository.count_reports_by_status(ReportStatus.PENDING)

        return response_reports, total, has_more