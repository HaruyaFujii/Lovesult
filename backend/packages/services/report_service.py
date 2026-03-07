from uuid import UUID
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from packages.models.report import Report, ReportType, ReportStatus
from packages.repositories.report_repository import ReportRepository
from packages.repositories.post_repository import PostRepository
from packages.repositories.reply_repository import ReplyRepository
from packages.repositories.user_repository import UserRepository


class ReportService:
    """報告サービスクラス"""

    def __init__(self, session: AsyncSession):
        self.session = session
        self.report_repository = ReportRepository(session)
        self.post_repository = PostRepository(session)
        self.reply_repository = ReplyRepository(session)
        self.user_repository = UserRepository(session)

    async def create_report(
        self,
        reporter_id: UUID,
        report_type: ReportType,
        reason: str,
        target_type: str,
        target_id: UUID,
    ) -> Report:
        """報告を作成する"""
        # 報告対象の存在確認
        post_id = None
        reply_id = None
        user_id = None

        if target_type == "post":
            post = await self.post_repository.get_by_id(target_id)
            if not post:
                raise ValueError("Post not found")
            post_id = target_id
        elif target_type == "reply":
            reply = await self.reply_repository.get_by_id(target_id)
            if not reply:
                raise ValueError("Reply not found")
            reply_id = target_id
        elif target_type == "user":
            user = await self.user_repository.get(target_id)
            if not user:
                raise ValueError("User not found")
            user_id = target_id
        else:
            raise ValueError("Invalid target type")

        # 自分自身への報告はできない
        if target_type == "user" and reporter_id == target_id:
            raise ValueError("Cannot report yourself")

        # 重複報告のチェック
        is_duplicate = await self.report_repository.check_duplicate_report(
            reporter_id=reporter_id,
            post_id=post_id,
            reply_id=reply_id,
            user_id=user_id,
        )
        if is_duplicate:
            raise ValueError("You have already reported this content")

        # 報告を作成
        report = await self.report_repository.create_report(
            reporter_id=reporter_id,
            report_type=report_type,
            reason=reason,
            post_id=post_id,
            reply_id=reply_id,
            user_id=user_id,
        )

        return report

    async def get_report(self, report_id: UUID) -> Optional[Report]:
        """報告を取得する"""
        return await self.report_repository.get_report_by_id(report_id)

    async def update_report_status(
        self,
        report_id: UUID,
        status: ReportStatus,
        reviewer_id: UUID,
        reviewer_comment: Optional[str] = None,
    ) -> Optional[Report]:
        """報告のステータスを更新する"""
        report = await self.report_repository.get_report_by_id(report_id)
        if not report:
            return None

        # ステータスの更新
        updated_report = await self.report_repository.update_report_status(
            report_id=report_id,
            status=status,
            reviewer_id=reviewer_id,
            reviewer_comment=reviewer_comment,
        )

        # RESOLVEDの場合、追加処理を実行
        if status == ReportStatus.RESOLVED and updated_report:
            await self._handle_resolved_report(updated_report)

        return updated_report

    async def _handle_resolved_report(self, report: Report):
        """解決済み報告の処理"""
        # ここで必要に応じて、報告対象のコンテンツを削除したり、
        # ユーザーをBANしたりする処理を実装
        pass