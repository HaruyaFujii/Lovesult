'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Reply } from '@/types';
import { ContentCard } from '@/components/common/ContentCard';
import { ActionBar } from '@/components/common/ActionBar';
import { ReportDialog } from '@/components/ReportDialog';
import { cn } from '@/lib/utils';

interface ReplyCardProps {
  reply: Reply;
  showActions?: boolean;
  onDelete?: () => void;
  onReplyClick?: (replyId: string) => void;
  isOptimistic?: boolean;
  depth?: number;
  className?: string;
}

export default function ReplyCard({
  reply,
  showActions = false,
  onDelete,
  onReplyClick,
  isOptimistic = false,
  depth = 0,
  className,
}: ReplyCardProps) {
  const router = useRouter();
  const [showReportDialog, setShowReportDialog] = useState(false);

  const handleClick = () => {
    // Navigate to post detail with focus on this reply
    router.push(`/post/${reply.post_id}?focus=${reply.id}`);
  };

  const handleReply = () => {
    if (onReplyClick) {
      onReplyClick(reply.id);
    }
  };

  const handleReport = () => {
    setShowReportDialog(true);
  };

  return (
    <>
      <div className={cn('relative', className)}>
        {/* Connection line for nested replies */}
        {depth > 0 && (
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />
        )}

        <ContentCard
          id={reply.id}
          content={reply.content}
          author={{
            id: reply.user?.id || reply.user_id,
            nickname: reply.user?.nickname,
            avatar_url: reply.user?.avatar_url,
          }}
          createdAt={reply.created_at}
          isOptimistic={isOptimistic}
          showActions={showActions}
          onDelete={onDelete}
          onReport={handleReport}
          onClick={handleClick}
          className={cn(depth > 0 && 'ml-8')}
        >
          <ActionBar
            targetId={reply.id}
            targetType="reply"
            isLiked={reply.is_liked || false}
            likesCount={reply.likes_count || 0}
            repliesCount={reply.replies_count}
            onReply={handleReply}
          />
        </ContentCard>
      </div>

      {/* Report Dialog */}
      <ReportDialog
        isOpen={showReportDialog}
        onClose={() => setShowReportDialog(false)}
        targetId={reply.id}
        targetType="reply"
      />
    </>
  );
}