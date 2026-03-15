'use client';

import { useRouter } from 'next/navigation';
import { Post } from '@/types';
import { ContentCard } from '@/components/common/ContentCard';
import { ActionBar } from '@/components/common/ActionBar';

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

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push(`/post/${post.id}`);
  };

  const handleReply = () => {
    router.push(`/post/${post.id}`);
  };

  return (
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
  );
}