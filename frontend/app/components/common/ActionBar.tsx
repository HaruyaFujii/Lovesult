'use client';

import { MessageCircle } from 'lucide-react';
import { LikeButton } from '@/components/LikeButton';
import { cn } from '@/lib/utils';

interface ActionBarProps {
  targetId: string;
  targetType?: 'post' | 'reply';
  isLiked: boolean;
  likesCount: number;
  repliesCount?: number;
  showReplyButton?: boolean;
  onReply?: () => void;
  className?: string;
}

export function ActionBar({
  targetId,
  targetType = 'post',
  isLiked,
  likesCount,
  repliesCount = 0,
  showReplyButton = true,
  onReply,
  className,
}: ActionBarProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Like button */}
      <LikeButton
        targetId={targetId}
        targetType={targetType}
        isLiked={isLiked}
        likesCount={likesCount}
        size="sm"
      />

      {/* Reply button */}
      {showReplyButton && onReply && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onReply();
          }}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-pink-600 transition-colors px-2 py-1"
        >
          <MessageCircle className="h-4 w-4" />
          {repliesCount > 0 && <span>{repliesCount}</span>}
        </button>
      )}
    </div>
  );
}