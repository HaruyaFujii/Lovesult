'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Post } from '@/types';
import { ContentCard } from '@/components/common/ContentCard';
import { ActionBar } from '@/components/common/ActionBar';
import { ReportDialog } from '@/components/ReportDialog';

interface PostCardProps {
  post: Post;
  showActions?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  isOptimistic?: boolean;
}

export default function PostCard({
  post,
  showActions = false,
  onEdit,
  onDelete,
  isOptimistic = false,
}: PostCardProps) {
  const router = useRouter();
  const [showReportDialog, setShowReportDialog] = useState(false);

  const handleClick = () => {
    router.push(`/post/${post.id}`);
  };

  const handleReply = () => {
    router.push(`/post/${post.id}`);
  };

  const handleReport = () => {
    setShowReportDialog(true);
  };

  return (
    <>
      <ContentCard
        id={post.id}
        content={post.content}
        author={{
          id: post.user?.id || post.user_id,
          nickname: post.user?.nickname,
          avatar_url: post.user?.avatar_url,
          status: post.author_status,
          bio: post.user?.bio,
        }}
        createdAt={post.created_at}
        isOptimistic={isOptimistic}
        showActions={showActions}
        onEdit={onEdit}
        onDelete={onDelete}
        onReport={handleReport}
        onClick={handleClick}
      >
        <ActionBar
          targetId={post.id}
          targetType="post"
          isLiked={post.is_liked || false}
          likesCount={post.likes_count || 0}
          repliesCount={post.replies_count}
          onReply={handleReply}
        />
      </ContentCard>

      {/* Report Dialog */}
      <ReportDialog
        isOpen={showReportDialog}
        onClose={() => setShowReportDialog(false)}
        targetId={post.id}
        targetType="post"
      />
    </>
  );
}