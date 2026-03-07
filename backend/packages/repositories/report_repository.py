from uuid import UUID
from typing import Optional, List
from datetime import datetime

from sqlmodel import select, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession

from packages.models.report import Report, ReportStatus, ReportType


class ReportRepository:
    """報告リポジトリクラス"""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def create_report(
        self,
        reporter_id: UUID,
        report_type: ReportType,
        reason: str,
        post_id: Optional[UUID] = None,
        reply_id: Optional[UUID] = None,
        user_id: Optional[UUID] = None,
    ) -> Report:
        """報告を作成する"""
        report = Report(
            reporter_id=reporter_id,
            report_type=report_type,
            reason=reason,
            post_id=post_id,
            reply_id=reply_id,
            user_id=user_id,
        )
        self.session.add(report)
        await self.session.commit()
        await self.session.refresh(report)
        return report

    async def get_report_by_id(self, report_id: UUID) -> Optional[Report]:
        """IDで報告を取得する"""
        result = await self.session.execute(
            select(Report).where(Report.id == report_id)
        )
        return result.scalar_one_or_none()

    async def check_duplicate_report(
        self,
        reporter_id: UUID,
        post_id: Optional[UUID] = None,
        reply_id: Optional[UUID] = None,
        user_id: Optional[UUID] = None,
    ) -> bool:
        """重複報告をチェックする"""
        conditions = [Report.reporter_id == reporter_id]

        if post_id:
            conditions.append(Report.post_id == post_id)
        elif reply_id:
            conditions.append(Report.reply_id == reply_id)
        elif user_id:
            conditions.append(Report.user_id == user_id)

        # PENDINGまたはREVIEWEDの状態の報告のみチェック
        conditions.append(
            or_(
                Report.status == ReportStatus.PENDING,
                Report.status == ReportStatus.REVIEWED
            )
        )

        result = await self.session.execute(
            select(Report).where(and_(*conditions))
        )
        return result.scalar_one_or_none() is not None

    async def get_reports_by_status(
        self,
        status: ReportStatus,
        limit: int = 20,
        offset: int = 0
    ) -> List[Report]:
        """ステータスで報告を取得する"""
        result = await self.session.execute(
            select(Report)
            .where(Report.status == status)
            .order_by(Report.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        return result.scalars().all()

    async def get_reports_for_post(self, post_id: UUID) -> List[Report]:
        """投稿に対する報告を取得する"""
        result = await self.session.execute(
            select(Report)
            .where(Report.post_id == post_id)
            .order_by(Report.created_at.desc())
        )
        return result.scalars().all()

    async def get_reports_for_reply(self, reply_id: UUID) -> List[Report]:
        """返信に対する報告を取得する"""
        result = await self.session.execute(
            select(Report)
            .where(Report.reply_id == reply_id)
            .order_by(Report.created_at.desc())
        )
        return result.scalars().all()

    async def get_reports_for_user(self, user_id: UUID) -> List[Report]:
        """ユーザーに対する報告を取得する"""
        result = await self.session.execute(
            select(Report)
            .where(Report.user_id == user_id)
            .order_by(Report.created_at.desc())
        )
        return result.scalars().all()

    async def update_report_status(
        self,
        report_id: UUID,
        status: ReportStatus,
        reviewer_id: Optional[UUID] = None,
        reviewer_comment: Optional[str] = None,
    ) -> Optional[Report]:
        """報告のステータスを更新する"""
        report = await self.get_report_by_id(report_id)
        if not report:
            return None

        report.status = status
        report.updated_at = datetime.utcnow()

        if status in [ReportStatus.REVIEWED, ReportStatus.RESOLVED, ReportStatus.DISMISSED]:
            report.reviewed_at = datetime.utcnow()
            if reviewer_id:
                report.reviewer_id = reviewer_id
            if reviewer_comment:
                report.reviewer_comment = reviewer_comment

        await self.session.commit()
        await self.session.refresh(report)
        return report

    async def count_reports_by_status(self, status: ReportStatus) -> int:
        """ステータスごとの報告数をカウントする"""
        result = await self.session.execute(
            select(Report).where(Report.status == status)
        )
        return len(result.scalars().all())