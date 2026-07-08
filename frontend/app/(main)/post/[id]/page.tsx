'use client';

import { useEffect, useState, use, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Heart, MessageCircle, MoreHorizontal, Trash2, Edit2, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { usePost } from '@/hooks/use-post-detail';
import { useReplies } from '@/hooks/use-replies';
import PostCardSkeleton from '@/components/post/PostCardSkeleton';
import ReplyCard from '@/components/reply/ReplyCard';
import PostForm from '@/components/post/PostForm';
import ReplyForm from '@/components/reply/ReplyForm';
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
import { findReplyRecursively, findReplyPath } from '@/lib/utils/reply-helpers';

interface PostDetailPageProps {
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

/**
 * 絶対時刻を「HH:mm · YYYY/MM/DD」風で JST 表示
 */
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

export default function PostDetailPage({ params }: PostDetailPageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const focusReplyId = searchParams.get('focus');
  const queryClient = useQueryClient();

  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{ id: string; nickname: string } | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());

  const { post, isLoading: postLoading, updatePost, deletePost } = usePost(resolvedParams.id);

  const {
    replies,
    isLoading: repliesLoading,
    createReply,
    deleteReply,
  } = useReplies({ postId: resolvedParams.id });

  // フォーカス投稿の楽観的いいね
  const serverIsLiked = post?.is_liked || false;
  const serverLikesCount = post?.likes_count || 0;
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
      await customInstance(`/api/v1/posts/${resolvedParams.id}/like`, { method: 'POST' });
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
      queryClient.invalidateQueries({ queryKey: ['post', resolvedParams.id] });
    },
  });

  const unlikeMutation = useMutation({
    mutationFn: async () => {
      await customInstance(`/api/v1/posts/${resolvedParams.id}/like`, { method: 'DELETE' });
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
      queryClient.invalidateQueries({ queryKey: ['post', resolvedParams.id] });
    },
  });

  const isLikePending = likeMutation.isPending || unlikeMutation.isPending;

  // フォーカスリプライのスクロール & ハイライト
  useEffect(() => {
    if (focusReplyId && replies && replies.length > 0) {
      const scrollToReply = () => {
        const element = document.getElementById(`reply-${focusReplyId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.classList.add('bg-blue-50');
          setTimeout(() => element.classList.remove('bg-blue-50'), 2000);
        }
      };
      const timer = setTimeout(scrollToReply, 500);
      return () => clearTimeout(timer);
    }
  }, [focusReplyId, replies]);

  // フォーカスリプライのパスを展開
  useEffect(() => {
    if (focusReplyId && replies && replies.length > 0) {
      const pathToExpand = findReplyPath(replies, focusReplyId);
      if (pathToExpand && pathToExpand.length > 0) {
        const timer = setTimeout(() => {
          setExpandedReplies(new Set(pathToExpand));
        }, 0);
        return () => clearTimeout(timer);
      }
    }
  }, [focusReplyId, replies]);

  const handleUpdatePost = async (content: string) => {
    updatePost(content);
    setEditing(false);
  };

  const handleDeletePost = () => {
    deletePost();
    router.push('/timeline');
  };

  const handleReplyClick = (replyId: string) => {
    const targetReply = findReplyRecursively(replies, replyId);
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
    const authorId = post?.user?.id || post?.user_id;
    if (authorId) {
      router.push(`/profile/${authorId}`);
    }
  };

  if (postLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-xl mx-auto sm:border-x border-gray-200">
          <PostCardSkeleton count={1} />
          <PostCardSkeleton count={3} />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">投稿が見つかりません (ID: {resolvedParams.id})</div>
      </div>
    );
  }

  const nickname = post.user?.nickname || 'Unknown';
  const avatarUrl = post.author_avatar_url || post.user?.avatar_url;
  const status = post.author_status;
  const repliesCount = post.replies_count ?? 0;
  const canEdit = user?.id === post.user_id;

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
            <span className="text-lg font-bold text-gray-900">投稿</span>
          </div>

          {/* フォーカス投稿 */}
          {editing ? (
            <div className="p-4 border-b border-gray-200">
              <PostForm
                initialContent={post.content}
                onSubmit={handleUpdatePost}
                submitLabel="更新"
              />
              <button
                onClick={() => setEditing(false)}
                className="mt-2 text-sm text-gray-600 hover:text-gray-900"
              >
                キャンセル
              </button>
            </div>
          ) : (
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
                      <AvatarFallback className="text-xs">
                        {nickname.charAt(0) || 'U'}
                      </AvatarFallback>
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
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {getUserStatusLabel(status as any)}
                      </span>
                    )}
                  </div>
                </div>

                {/* メニュー */}
                <DropdownMenu>
                  <DropdownMenuTrigger
                    className="p-1.5 -m-1.5 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors focus:outline-none"
                    aria-label="投稿のメニュー"
                  >
                    <MoreHorizontal className="h-5 w-5" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {canEdit && (
                      <DropdownMenuItem onClick={() => setEditing(true)}>
                        <Edit2 className="h-4 w-4 mr-2" />
                        編集
                      </DropdownMenuItem>
                    )}
                    {canEdit && (
                      <DropdownMenuItem
                        onClick={handleDeletePost}
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

              {/* 本文 */}
              <p className="text-xl leading-relaxed whitespace-pre-wrap break-words mt-3 text-gray-900">
                {post.content}
              </p>

              {/* 時刻 */}
              <div className="text-sm text-gray-500 mt-3">{formatAbsoluteJST(post.created_at)}</div>
            </article>
          )}

          {/* 統計行 */}
          {!editing && (likesCount > 0 || repliesCount > 0) && (
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
          {!editing && (
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
          )}

          {/* リプライ一覧 */}
          <div>
            {replies.map((reply) => {
              const shouldExpand = expandedReplies.has(reply.id) || focusReplyId === reply.id;
              return (
                <div
                  key={reply.id}
                  id={`reply-${reply.id}`}
                  className="transition-colors duration-500"
                >
                  <ReplyCard
                    reply={reply}
                    showActions={user?.id === reply.user_id}
                    onDelete={() => handleDeleteReply(reply.id)}
                    onReplyClick={handleReplyClick}
                    isOptimistic={reply._optimistic}
                  />

                  {/* ネスト返信 */}
                  {shouldExpand && reply.replies && reply.replies.length > 0 && (
                    <div>
                      {reply.replies.map((nestedReply) => (
                        <ReplyCard
                          key={nestedReply.id}
                          reply={nestedReply}
                          showActions={user?.id === nestedReply.user_id}
                          onDelete={() => handleDeleteReply(nestedReply.id)}
                          onReplyClick={handleReplyClick}
                          isOptimistic={nestedReply._optimistic}
                          depth={1}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

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
      {user && (
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
