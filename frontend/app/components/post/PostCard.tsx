'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Heart, MessageCircle, MoreHorizontal, Trash2, Edit2 } from 'lucide-react';
import { Post } from '@/types';
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

interface PostCardProps {
  post: Post;
  showActions?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  isOptimistic?: boolean;
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

export default function PostCard({
  post,
  showActions = false,
  onEdit,
  onDelete,
  isOptimistic: isOptimisticProp = false,
}: PostCardProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isOptimistic = isOptimisticProp || Boolean((post as any)._optimistic);

  const authorId = post.user?.id || post.user_id || '';
  const nickname = post.user?.nickname || 'Unknown';
  const avatarUrl = post.author_avatar_url || post.user?.avatar_url;
  const status = post.author_status;

  // 楽観的なオーバーライド（サーバー値が変わったら null にリセット）
  // null のときはサーバー値を使う
  const serverIsLiked = post.is_liked || false;
  const serverLikesCount = post.likes_count || 0;
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
      await customInstance(`/api/v1/posts/${post.id}/like`, { method: 'POST' });
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
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['post', post.id] });
    },
  });

  const unlikeMutation = useMutation({
    mutationFn: async () => {
      await customInstance(`/api/v1/posts/${post.id}/like`, { method: 'DELETE' });
    },
    onMutate: () => {
      setOptimisticLike({ isLiked: false, delta: serverIsLiked ? -1 : 0 });
    },
    onError: () => {
      setOptimisticLike(null);
    },
    onSuccess: () => {
      setOptimisticLike(null);
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['post', post.id] });
    },
  });

  const isLikePending = likeMutation.isPending || unlikeMutation.isPending;

  const handleCardClick = useCallback(() => {
    if (isOptimistic) return;
    router.push(`/post/${post.id}`);
  }, [router, post.id, isOptimistic]);

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
    router.push(`/post/${post.id}`);
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
        isOptimistic ? 'opacity-70' : 'cursor-pointer hover:bg-gray-50 active:bg-gray-100'
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
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {getUserStatusLabel(status as any)}
              </span>
            )}
            <span className="text-sm text-gray-500">・</span>
            <span className="text-sm text-gray-500">
              {isOptimistic ? '投稿中...' : formatDistanceToNowJST(post.created_at)}
            </span>
          </div>

          {/* メニュー */}
          {!isOptimistic && (
            <div onClick={stopPropagation}>
              <DropdownMenu>
                <DropdownMenuTrigger
                  className="p-1.5 -m-1.5 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors focus:outline-none"
                  onClick={stopPropagation}
                  aria-label="投稿のメニュー"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" onClick={stopPropagation}>
                  {showActions && onEdit && (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit();
                      }}
                    >
                      <Edit2 className="h-4 w-4 mr-2" />
                      編集
                    </DropdownMenuItem>
                  )}
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
                    targetType="post"
                    targetId={post.id}
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
          {post.content}
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
            {(post.replies_count ?? 0) > 0 && <span className="text-sm">{post.replies_count}</span>}
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
