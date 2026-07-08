'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Heart, MessageCircle, MoreHorizontal, Trash2 } from 'lucide-react';
import { Reply } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ReportDialog } from '@/components/ReportDialog';
import { formatDistanceToNowJST } from '@/lib/utils/date';
import { getUserStatusLabel } from '@/lib/utils/enum-labels';
import { customInstance } from '@/lib/api/customInstance';
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

const getStatusClasses = (status?: string): string => {
  switch (status) {
    case 'IN_LOVE':
      return 'bg-pink-100 text-pink-800';
    case 'HEARTBROKEN':
      return 'bg-blue-100 text-blue-800';
    case 'SEEKING':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default function ReplyCard({
  reply,
  showActions = false,
  onDelete,
  onReplyClick,
  isOptimistic: isOptimisticProp = false,
  depth = 0,
  className,
}: ReplyCardProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const isOptimistic = isOptimisticProp || Boolean(reply._optimistic);

  const authorId = reply.user?.id || reply.user_id || '';
  const nickname = reply.user?.nickname || 'Unknown';
  const avatarUrl = reply.user?.avatar_url;
  const status = reply.user?.status;

  const serverIsLiked = reply.is_liked || false;
  const serverLikesCount = reply.likes_count || 0;
  const [optimisticLike, setOptimisticLike] = useState<{
    isLiked: boolean;
    delta: number;
  } | null>(null);
  const isLiked = optimisticLike ? optimisticLike.isLiked : serverIsLiked;
  const likesCount = optimisticLike
    ? Math.max(0, serverLikesCount + optimisticLike.delta)
    : serverLikesCount;

  const likeMutation = useMutation({
    mutationFn: async () => {
      await customInstance(`/api/v1/replies/${reply.id}/like`, { method: 'POST' });
    },
    onMutate: () => {
      setOptimisticLike({ isLiked: true, delta: serverIsLiked ? 0 : 1 });
    },
    onError: () => {
      setOptimisticLike(null);
    },
    onSuccess: () => {
      setOptimisticLike(null);
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['replies'] });
      queryClient.invalidateQueries({ queryKey: ['reply', reply.id] });
    },
  });

  const unlikeMutation = useMutation({
    mutationFn: async () => {
      await customInstance(`/api/v1/replies/${reply.id}/like`, { method: 'DELETE' });
    },
    onMutate: () => {
      setOptimisticLike({ isLiked: false, delta: serverIsLiked ? -1 : 0 });
    },
    onError: () => {
      setOptimisticLike(null);
    },
    onSuccess: () => {
      setOptimisticLike(null);
      queryClient.invalidateQueries({ queryKey: ['replies'] });
      queryClient.invalidateQueries({ queryKey: ['reply', reply.id] });
    },
  });

  const isLikePending = likeMutation.isPending || unlikeMutation.isPending;

  const handleCardClick = useCallback(() => {
    if (isOptimistic) return;
    router.push(`/reply/${reply.id}`);
  }, [router, reply.id, isOptimistic]);

  const handleAvatarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (authorId) {
      router.push(`/profile/${authorId}`);
    }
  };

  const handleNicknameClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (authorId) {
      router.push(`/profile/${authorId}`);
    }
  };

  const handleReply = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOptimistic) return;
    if (onReplyClick) {
      onReplyClick(reply.id);
    } else {
      router.push(`/reply/${reply.id}`);
    }
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLikePending || isOptimistic) return;
    if (isLiked) {
      unlikeMutation.mutate();
    } else {
      likeMutation.mutate();
    }
  };

  const stopPropagation = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <article
      className={cn(
        'flex gap-3 border-b border-gray-200 px-4 py-3 transition-colors',
        depth > 0 && 'ml-5 pl-3 border-l-2 border-gray-100',
        isOptimistic ? 'opacity-70' : 'cursor-pointer hover:bg-gray-50 active:bg-gray-100',
        className
      )}
      onClick={handleCardClick}
    >
      {/* アバター */}
      <button
        type="button"
        onClick={handleAvatarClick}
        className="flex-shrink-0 focus:outline-none"
        aria-label={`${nickname}のプロフィールを見る`}
      >
        <Avatar className="h-10 w-10">
          <AvatarImage src={avatarUrl || undefined} />
          <AvatarFallback className="text-xs">{nickname.charAt(0) || 'U'}</AvatarFallback>
        </Avatar>
      </button>

      {/* 右カラム */}
      <div className="flex-1 min-w-0">
        {/* ヘッダー */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 min-w-0">
            <button
              type="button"
              onClick={handleNicknameClick}
              className="font-bold text-[15px] text-gray-900 hover:underline truncate max-w-full"
            >
              {nickname}
            </button>
            {status && (
              <span
                className={cn(
                  'text-[11px] leading-none px-1.5 py-0.5 rounded-full',
                  getStatusClasses(status)
                )}
              >
                {getUserStatusLabel(status)}
              </span>
            )}
            <span className="text-sm text-gray-500">・</span>
            <span className="text-sm text-gray-500">
              {isOptimistic ? '送信中...' : formatDistanceToNowJST(reply.created_at)}
            </span>
          </div>

          {/* メニュー */}
          {!isOptimistic && (
            <div onClick={stopPropagation}>
              <DropdownMenu>
                <DropdownMenuTrigger
                  className="p-1.5 -m-1.5 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors focus:outline-none"
                  onClick={stopPropagation}
                  aria-label="リプライのメニュー"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" onClick={stopPropagation}>
                  {showActions && onDelete && (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                      }}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      削除
                    </DropdownMenuItem>
                  )}
                  <ReportDialog
                    targetType="reply"
                    targetId={reply.id}
                    triggerText="報告"
                    triggerIcon={false}
                    asDropdownItem={true}
                  />
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

        {/* 本文 */}
        <p className="mt-0.5 text-[15px] text-gray-900 whitespace-pre-wrap break-words leading-relaxed">
          {reply.content}
        </p>

        {/* アクションバー */}
        <div className="mt-2 flex items-center gap-12 -ml-2 text-gray-500">
          {/* 返信 */}
          <button
            type="button"
            onClick={handleReply}
            disabled={isOptimistic}
            className="group flex items-center gap-1 p-2 rounded-full transition-colors hover:text-pink-600 hover:bg-pink-50 disabled:hover:bg-transparent disabled:hover:text-gray-500 focus:outline-none"
            aria-label="返信"
          >
            <MessageCircle className="h-[18px] w-[18px]" />
            {(reply.replies_count ?? 0) > 0 && (
              <span className="text-sm">{reply.replies_count}</span>
            )}
          </button>

          {/* いいね */}
          <button
            type="button"
            onClick={handleLike}
            disabled={isLikePending || isOptimistic}
            className={cn(
              'group flex items-center gap-1 p-2 rounded-full transition-colors focus:outline-none',
              isLiked
                ? 'text-pink-600 hover:text-pink-700 hover:bg-pink-50'
                : 'hover:text-pink-600 hover:bg-pink-50'
            )}
            aria-label={isLiked ? 'いいねを取り消す' : 'いいねする'}
            aria-pressed={isLiked}
          >
            <Heart className={cn('h-[18px] w-[18px]', isLiked && 'fill-current')} />
            {likesCount > 0 && <span className="text-sm">{likesCount}</span>}
          </button>
        </div>
      </div>
    </article>
  );
}
