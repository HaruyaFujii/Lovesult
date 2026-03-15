'use client';

import { useRouter } from 'next/navigation';
import { Reply } from '@/types';
import { ContentCard } from '@/components/common/ContentCard';
import { ActionBar } from '@/components/common/ActionBar';
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

  const handleClick = (e: React.MouseEvent) => {
    // Prevent default link behavior if this is within a link
    e.preventDefault();
    e.stopPropagation();

    // Navigate to reply detail page
    router.push(`/reply/${reply.id}`);
  };

  const handleReply = () => {
    if (onReplyClick) {
      onReplyClick(reply.id);
    }
  };

  return (
    <div className={cn('relative', className)}>
      {/* Connection line for nested replies */}
      {depth > 0 && <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />}

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
  );
}
