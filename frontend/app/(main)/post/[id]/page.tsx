'use client';

import { useEffect, useState, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useCurrentUser } from '@/hooks/use-user';
import { usePost } from '@/hooks/use-post-detail';
import { useReplies } from '@/hooks/use-replies';
import { Post, Reply } from '@/types';
import PostCard from '@/components/post/PostCard';
import ReplyCard from '@/components/reply/ReplyCard';
import PostForm from '@/components/post/PostForm';
import ReplyForm from '@/components/reply/ReplyForm';
import { findReplyRecursively, findReplyPath } from '@/lib/utils/reply-helpers';

interface PostDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function PostDetailPage({ params }: PostDetailPageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const focusReplyId = searchParams.get('focus');

  const { user } = useAuth();
  const { data: currentUser } = useCurrentUser();
  const [editing, setEditing] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{ id: string; nickname: string } | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());

  // Use custom hooks for data fetching
  const {
    post,
    isLoading: postLoading,
    updatePost,
    deletePost,
    refetch: refetchPost,
  } = usePost(resolvedParams.id);

  const {
    replies,
    isLoading: repliesLoading,
    createReply,
    deleteReply,
    refetch: refetchReplies,
  } = useReplies({ postId: resolvedParams.id });

  // No longer need to force refetch since we're not navigating to a new page

  // Focus on specific reply if needed
  useEffect(() => {
    if (focusReplyId && replies && replies.length > 0) {
      const pathToExpand = findReplyPath(replies, focusReplyId);
      if (pathToExpand) {
        setExpandedReplies(prev => {
          // Only update if the path has changed
          const newSet = new Set(pathToExpand);
          const hasChanged = pathToExpand.length !== prev.size ||
            !pathToExpand.every(id => prev.has(id));
          return hasChanged ? newSet : prev;
        });
        // Scroll to focused reply after a short delay to ensure DOM is ready
        setTimeout(() => {
          const element = document.getElementById(`reply-${focusReplyId}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.classList.add('bg-blue-50');
            setTimeout(() => element.classList.remove('bg-blue-50'), 2000);
          }
        }, 500); // Increased delay to ensure data is loaded
      }
    }
  }, [focusReplyId, replies.length]); // Add replies.length as dependency

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
        nickname: targetReply.user?.nickname || 'Unknown'
      });
      // Scroll to reply form
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
    createReply({ content, parentId: replyingTo?.id });
    setReplyingTo(null);
  };

  const handleDeleteReply = async (replyId: string) => {
    deleteReply(replyId);
  };

  if (postLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    );
  }

  if (!post) {
    console.error('Post not found for ID:', resolvedParams.id);
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">投稿が見つかりません (ID: {resolvedParams.id})</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-24">
      <div className="max-w-2xl mx-auto">
        {/* Post */}
        <div className="border-b">
          {editing ? (
            <div className="p-4">
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
            <PostCard
              post={post}
              showActions={user?.id === post.user_id}
              onEdit={() => setEditing(true)}
              onDelete={handleDeletePost}
            />
          )}
        </div>

        {/* Replies */}
        <div className="divide-y divide-gray-100">
          {replies.map((reply) => {
            const shouldExpand = expandedReplies.has(reply.id) || focusReplyId === reply.id;
            return (
              <div
                key={reply.id}
                id={`reply-${reply.id}`}
                className="transition-colors duration-500"
              >
                <ReplyCard
                  reply={{
                    ...reply,
                    // Show nested replies if expanded
                    replies: shouldExpand ? reply.replies : [],
                  }}
                  showActions={user?.id === reply.user_id}
                  onDelete={() => handleDeleteReply(reply.id)}
                  onReplyClick={handleReplyClick}
                  isOptimistic={reply._optimistic}
                />

                {/* Show nested replies if they exist */}
                {shouldExpand && reply.replies && reply.replies.length > 0 && (
                  <div className="ml-12 divide-y divide-gray-100">
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
            <div className="text-center py-12 text-gray-500">
              まだリプライはありません
            </div>
          )}
        </div>
      </div>

      {/* Reply Form (Fixed at bottom) */}
      {user && (
        <div
          id="main-reply-form"
          className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white safe-area-bottom z-10"
        >
          <div className="max-w-2xl mx-auto p-4">
            {replyingTo && (
              <div className="flex items-center justify-between mb-2 p-2 bg-gray-50 rounded">
                <span className="text-sm text-gray-600">
                  @{replyingTo.nickname}さんに返信
                </span>
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
              placeholder={
                replyingTo
                  ? `@${replyingTo.nickname}さんに返信`
                  : 'リプライを追加...'
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}