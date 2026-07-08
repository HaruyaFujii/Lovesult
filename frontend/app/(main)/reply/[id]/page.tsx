'use client';

import { useState, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Heart, MessageCircle, MoreHorizontal, Trash2, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCurrentUser } from '@/hooks/use-user';
import { useReplyDetail } from '@/hooks/use-reply-detail';
import { useReplies } from '@/hooks/use-replies-for-reply';
import ReplyCard from '@/components/reply/ReplyCard';
import ReplyForm from '@/components/reply/ReplyForm';
import PostCardSkeleton from '@/components/post/PostCardSkeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ReportDialog } from '@/components/ReportDialog';
import { customInstance } from '@/lib/api/customInstance';
import { cn } from '@/lib/utils';
import { getUserStatusLabel } from '@/lib/utils/enum-labels';

interface ReplyDetailPageProps {
  params: Promise<{ id: string }>;
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

function formatAbsoluteJST(dateString: string): string {
  const utcDate = new Date(dateString);
  const jstDate = new Date(utcDate.getTime() + 9 * 60 * 60 * 1000);
  const hh = String(jstDate.getUTCHours()).padStart(2, '0');
  const mm = String(jstDate.getUTCMinutes()).padStart(2, '0');
  const y = jstDate.getUTCFullYear();
  const mo = String(jstDate.getUTCMonth() + 1).padStart(2, '0');
  const d = String(jstDate.getUTCDate()).padStart(2, '0');
  return `${hh}:${mm} · ${y}/${mo}/${d}`;
}

export default function ReplyDetailPage({ params }: ReplyDetailPageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: currentUser } = useCurrentUser();
  const [replyingTo, setReplyingTo] = useState<{ id: string; nickname: string } | null>(null);

  const {
    reply,
    isLoading: replyLoading,
    deleteReply: deleteMainReply,
  } = useReplyDetail(resolvedParams.id);

  const {
    replies,
    isLoading: repliesLoading,
    createReply,
    deleteReply,
  } = useReplies({ replyId: resolvedParams.id });

  // フォーカスリプライの楽観的いいね
  const serverIsLiked = reply?.is_liked || false;
  const serverLikesCount = reply?.likes_count || 0;
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
      await customInstance(`/api/v1/replies/${resolvedParams.id}/like`, { method: 'POST' });
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
      queryClient.invalidateQueries({ queryKey: ['reply', resolvedParams.id] });
    },
  });

  const unlikeMutation = useMutation({
    mutationFn: async () => {
      await customInstance(`/api/v1/replies/${resolvedParams.id}/like`, { method: 'DELETE' });
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
      queryClient.invalidateQueries({ queryKey: ['reply', resolvedParams.id] });
    },
  });

  const isLikePending = likeMutation.isPending || unlikeMutation.isPending;

  const handleDeleteMainReply = async () => {
    await deleteMainReply();
    if (reply?.post_id) {
      router.push(`/post/${reply.post_id}`);
    } else {
      router.push('/timeline');
    }
  };

  const handleShowThread = () => {
    if (reply?.parent_id) {
      router.push(`/reply/${reply.parent_id}`);
    } else if (reply?.post_id) {
      router.push(`/post/${reply.post_id}`);
    }
  };

  const handleReplyClick = (replyId: string) => {
    const targetReply = replies.find((r) => r.id === replyId);
    if (targetReply) {
      setReplyingTo({
        id: replyId,
        nickname: targetReply.user?.nickname || 'Unknown',
      });
      setTimeout(() => {
        const form = document.querySelector('#main-reply-form');
        if (form) {
          form.scrollIntoView({ behavior: 'smooth' });
          const textarea = form.querySelector('textarea');
          if (textarea) {
            (textarea as HTMLTextAreaElement).focus();
          }
        }
      }, 100);
    }
  };

  const handleCreateReply = async (content: string) => {
    const parentId = replyingTo?.id || resolvedParams.id;
    createReply({ content, parentId });
    setReplyingTo(null);
  };

  const handleDeleteReply = async (replyId: string) => {
    deleteReply(replyId);
  };

  const handleFocusReply = useCallback(() => {
    setReplyingTo(null);
    setTimeout(() => {
      const form = document.querySelector('#main-reply-form');
      if (form) {
        form.scrollIntoView({ behavior: 'smooth' });
        const textarea = form.querySelector('textarea');
        if (textarea) {
          (textarea as HTMLTextAreaElement).focus();
        }
      }
    }, 100);
  }, []);

  const handleFocusLike = useCallback(() => {
    if (isLikePending) return;
    if (isLiked) {
      unlikeMutation.mutate();
    } else {
      likeMutation.mutate();
    }
  }, [isLiked, isLikePending, likeMutation, unlikeMutation]);

  const handleAuthorNavigate = () => {
    const authorId = reply?.user?.id || reply?.user_id;
    if (authorId) {
      router.push(`/profile/${authorId}`);
    }
  };

  if (replyLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-xl mx-auto sm:border-x border-gray-200">
          <PostCardSkeleton count={1} />
          <PostCardSkeleton count={3} />
        </div>
      </div>
    );
  }

  if (!reply) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">リプライが見つかりません</div>
      </div>
    );
  }

  const nickname = reply.user?.nickname || 'Unknown';
  const avatarUrl = reply.user?.avatar_url;
  const status = reply.user?.status;
  const repliesCount = reply.replies_count ?? 0;
  const canEdit = user?.id === reply.user_id;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* スクロール可能なコンテンツエリア */}
      <div className="flex-1 overflow-y-auto" style={{ paddingBottom: '200px' }}>
        <div className="max-w-xl mx-auto sm:border-x border-gray-200">
          {/* ヘッダー(戻る) */}
          <div className="sticky top-0 z-10 flex items-center gap-4 border-b border-gray-200 bg-white/90 px-4 py-2 backdrop-blur">
            <button
              type="button"
              onClick={() => router.back()}
              className="p-2 -ml-2 rounded-full hover:bg-gray-100 focus:outline-none"
              aria-label="戻る"
            >
              <ArrowLeft className="h-5 w-5 text-gray-900" />
            </button>
            <span className="text-lg font-bold text-gray-900">リプライ</span>
          </div>

          {/* スレッド動線 */}
          {(reply.parent_id || reply.post_id) && (
            <button
              type="button"
              onClick={handleShowThread}
              className="w-full text-left border-b border-gray-200 px-4 py-2 text-sm text-pink-600 hover:bg-gray-50 focus:outline-none"
            >
              スレッドを表示
            </button>
          )}

          {/* フォーカスリプライ */}
          <article className="px-4 pt-3 pb-2">
            {/* 作者行 */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={handleAuthorNavigate}
                  className="flex-shrink-0 focus:outline-none"
                  aria-label={`${nickname}のプロフィールを見る`}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={avatarUrl || undefined} />
                    <AvatarFallback className="text-xs">{nickname.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                </button>
                <div className="flex flex-col min-w-0">
                  <button
                    type="button"
                    onClick={handleAuthorNavigate}
                    className="font-bold text-[15px] text-gray-900 hover:underline truncate text-left"
                  >
                    {nickname}
                  </button>
                  {status && (
                    <span
                      className={cn(
                        'mt-0.5 self-start text-[11px] leading-none px-1.5 py-0.5 rounded-full',
                        getStatusClasses(status)
                      )}
                    >
                      {getUserStatusLabel(status)}
                    </span>
                  )}
                </div>
              </div>

              {/* メニュー */}
              <DropdownMenu>
                <DropdownMenuTrigger
                  className="p-1.5 -m-1.5 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors focus:outline-none"
                  aria-label="リプライのメニュー"
                >
                  <MoreHorizontal className="h-5 w-5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {canEdit && (
                    <DropdownMenuItem
                      onClick={handleDeleteMainReply}
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

            {/* 本文 */}
            <p className="text-xl leading-relaxed whitespace-pre-wrap break-words mt-3 text-gray-900">
              {reply.content}
            </p>

            {/* 時刻 */}
            <div className="text-sm text-gray-500 mt-3">{formatAbsoluteJST(reply.created_at)}</div>
          </article>

          {/* 統計行 */}
          {(likesCount > 0 || repliesCount > 0) && (
            <div className="flex items-center gap-6 border-t border-b border-gray-200 px-4 py-3 text-sm text-gray-600">
              {likesCount > 0 && (
                <div>
                  <span className="font-bold text-gray-900">{likesCount}</span>
                  <span className="ml-1">件のいいね</span>
                </div>
              )}
              {repliesCount > 0 && (
                <div>
                  <span className="font-bold text-gray-900">{repliesCount}</span>
                  <span className="ml-1">件の返信</span>
                </div>
              )}
            </div>
          )}

          {/* アクションバー */}
          <div className="flex items-center justify-around border-b border-gray-200 px-4 py-1 text-gray-500">
            <button
              type="button"
              onClick={handleFocusReply}
              className="group flex items-center gap-1 p-2 rounded-full transition-colors hover:text-pink-600 hover:bg-pink-50 focus:outline-none"
              aria-label="返信"
            >
              <MessageCircle className="h-[18px] w-[18px]" />
            </button>
            <button
              type="button"
              onClick={handleFocusLike}
              disabled={isLikePending}
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
            </button>
          </div>

          {/* 子リプライ一覧 */}
          <div>
            {replies.map((nestedReply) => (
              <ReplyCard
                key={nestedReply.id}
                reply={nestedReply}
                showActions={user?.id === nestedReply.user_id}
                onDelete={() => handleDeleteReply(nestedReply.id)}
                onReplyClick={handleReplyClick}
                isOptimistic={nestedReply._optimistic}
              />
            ))}

            {replies.length === 0 && !repliesLoading && (
              <EmptyState
                icon={MessageCircle}
                title="まだリプライはありません"
                description="最初のリプライを送ってみませんか？"
              />
            )}
            {replies.length === 0 && repliesLoading && <PostCardSkeleton count={2} />}
          </div>
        </div>
      </div>

      {/* Reply Form (Fixed at bottom) */}
      {(user || currentUser) && (
        <div
          id="main-reply-form"
          className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white safe-area-bottom z-10"
        >
          <div className="max-w-xl mx-auto">
            {replyingTo && (
              <div className="flex items-center justify-between mx-4 mt-2 p-2 bg-gray-50 rounded">
                <span className="text-sm text-gray-600">@{replyingTo.nickname}さんに返信</span>
                <button
                  onClick={() => setReplyingTo(null)}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  キャンセル
                </button>
              </div>
            )}
            <ReplyForm
              onSubmit={handleCreateReply}
              placeholder={replyingTo ? `@${replyingTo.nickname}さんに返信` : 'リプライを追加...'}
            />
          </div>
        </div>
      )}
    </div>
  );
}
