'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useCurrentUser } from '@/hooks/use-user';
import { useReplyDetail } from '@/hooks/use-reply-detail';
import { useReplies } from '@/hooks/use-replies-for-reply';
import { ContentCard } from '@/components/common/ContentCard';
import { ActionBar } from '@/components/common/ActionBar';
import ReplyCard from '@/components/reply/ReplyCard';
import ReplyForm from '@/components/reply/ReplyForm';

interface ReplyDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function ReplyDetailPage({ params }: ReplyDetailPageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const { data: currentUser } = useCurrentUser();
  const [replyingTo, setReplyingTo] = useState<{ id: string; nickname: string } | null>(null);

  // Fetch the main reply
  const {
    reply,
    isLoading: replyLoading,
    deleteReply: deleteMainReply,
  } = useReplyDetail(resolvedParams.id);

  // Fetch replies to this reply
  const {
    replies,
    isLoading: repliesLoading,
    createReply,
    deleteReply,
  } = useReplies({ replyId: resolvedParams.id });

  const handleDeleteMainReply = async () => {
    await deleteMainReply();
    // Navigate back to the original post
    if (reply?.post_id) {
      router.push(`/post/${reply.post_id}`);
    } else {
      router.push('/timeline');
    }
  };

  const handleMainReplyClick = (e: React.MouseEvent) => {
    e.preventDefault();
    // Navigate to the original post if parent_id is null
    if (reply && !reply.parent_id && reply.post_id) {
      router.push(`/post/${reply.post_id}`);
    } else if (reply?.parent_id) {
      // Navigate to parent reply
      router.push(`/reply/${reply.parent_id}`);
    }
  };

  const handleReplyClick = (replyId: string) => {
    const targetReply = replies.find((r) => r.id === replyId);
    if (targetReply) {
      setReplyingTo({
        id: replyId,
        nickname: targetReply.user?.nickname || 'Unknown',
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
    // If replyingTo is set, use that ID as parentId, otherwise use the current reply ID
    const parentId = replyingTo?.id || resolvedParams.id;
    createReply({ content, parentId });
    setReplyingTo(null);
  };

  const handleDeleteReply = async (replyId: string) => {
    deleteReply(replyId);
  };

  const handleReply = () => {
    // Scroll to reply form
    const form = document.querySelector('#main-reply-form');
    if (form) {
      form.scrollIntoView({ behavior: 'smooth' });
      const textarea = form.querySelector('textarea');
      if (textarea) {
        (textarea as HTMLTextAreaElement).focus();
      }
    }
  };

  if (replyLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">読み込み中...</div>
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

  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="max-w-2xl mx-auto">
        {/* Main Reply */}
        <div className="border-b">
          <ContentCard
            id={reply.id}
            content={reply.content}
            author={{
              id: reply.user?.id || reply.user_id,
              nickname: reply.user?.nickname,
              avatar_url: reply.user?.avatar_url,
              status: reply.user?.status,
              bio: reply.user?.bio,
            }}
            createdAt={reply.created_at}
            showActions={user?.id === reply.user_id}
            onDelete={handleDeleteMainReply}
            onClick={handleMainReplyClick}
            className="border-b-2 border-gray-200"
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

        {/* Replies to this reply */}
        <div className="divide-y divide-gray-100">
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
            <div className="text-center py-12 text-gray-500">まだリプライはありません</div>
          )}
        </div>
      </div>

      {/* Reply Form (Fixed at bottom - ナビゲーションなしなので直接bottom-0) */}
      {(user || currentUser) && (
        <div
          id="main-reply-form"
          className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white safe-area-bottom z-10"
        >
          <div className="max-w-2xl mx-auto p-4">
            {replyingTo && (
              <div className="flex items-center justify-between mb-2 p-2 bg-gray-50 rounded">
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
