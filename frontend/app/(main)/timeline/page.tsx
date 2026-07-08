'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { MessageCircle, Users } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCurrentUser } from '@/hooks/use-user';
import PostCard from '@/components/post/PostCard';
import PostCardSkeleton from '@/components/post/PostCardSkeleton';
import StatusFilter from '@/components/timeline/StatusFilter';
import { EmptyState } from '@/components/common/EmptyState';
import { UserStatus } from '@/types';
import { useQueryClient } from '@tanstack/react-query';
import { usePosts } from '@/hooks/use-posts';
import { useDeletePostMutation } from '@/hooks/use-post';
import { TimelineHeader } from '@/components/layout/TimelineHeader';
import { PullToRefreshContainer } from '@/components/layout/PullToRefreshContainer';
import { DeleteConfirmModal } from '@/components/ui/DeleteConfirmModal';

export default function TimelinePage() {
  const {} = useAuth();
  const { data: currentUser } = useCurrentUser();
  const queryClient = useQueryClient();
  const deletePost = useDeletePostMutation();
  const [statusFilter, setStatusFilter] = useState<UserStatus | 'all'>('all');
  const [activeTab, setActiveTab] = useState<'recommended' | 'following'>('recommended');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);

  // クエリパラメータを構築
  const queryParams = {
    limit: 20,
    ...(statusFilter !== 'all' && { status: statusFilter }),
    ...(activeTab === 'following' && { tab: 'following' as const }),
  };

  // 投稿データをフェッチ
  const postsQuery = usePosts(queryParams);

  const handleStatusFilterChange = (status: UserStatus | 'all') => {
    setStatusFilter(status);
  };

  const handleTabChange = (tab: 'recommended' | 'following') => {
    setActiveTab(tab);
  };

  const handleRefresh = async () => {
    await postsQuery.refetch();
  };

  const handleDeletePost = (postId: string) => {
    setPostToDelete(postId);
    setDeleteModalOpen(true);
  };

  const confirmDeletePost = async () => {
    if (!postToDelete) return;

    // 楽観的更新：即座に投稿を一覧から削除
    queryClient.setQueryData(['posts', queryParams], (old: unknown) => {
      const oldData = old as { posts: Array<{ id: string }> } | undefined;
      if (!oldData) return oldData;
      return {
        ...oldData,
        posts: oldData.posts.filter((post) => post.id !== postToDelete),
      };
    });

    try {
      await deletePost.mutateAsync({ postId: postToDelete });
    } catch (error) {
      console.error('投稿の削除に失敗しました:', error);
      // エラー時は元に戻すため再取得
      await postsQuery.refetch();
      toast.error('投稿の削除に失敗しました');
    } finally {
      setPostToDelete(null);
    }
  };

  // 投稿データ
  const posts = postsQuery.data?.posts || [];
  const loading = postsQuery.isLoading;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* モバイルヘッダー */}
      <TimelineHeader />

      {/* メインコンテンツ */}
      <PullToRefreshContainer onRefresh={handleRefresh}>
        <div className="pb-20">
          <div className="max-w-xl mx-auto sm:border-x border-gray-200 bg-white">
            {/* タブフィルター */}
            <div className="bg-white border-b border-gray-200">
              <div className="flex">
                <button
                  onClick={() => handleTabChange('recommended')}
                  className={`
                    flex-1 py-3 text-sm font-medium text-center
                    border-b-2 transition-colors duration-200
                    ${
                      activeTab === 'recommended'
                        ? 'border-pink-500 text-pink-500'
                        : 'border-transparent text-gray-500'
                    }
                  `}
                >
                  おすすめ
                </button>
                <button
                  onClick={() => handleTabChange('following')}
                  className={`
                    flex-1 py-3 text-sm font-medium text-center
                    border-b-2 transition-colors duration-200
                    ${
                      activeTab === 'following'
                        ? 'border-pink-500 text-pink-500'
                        : 'border-transparent text-gray-500'
                    }
                  `}
                >
                  フォロー中
                </button>
              </div>
            </div>

            {/* ステータスフィルター */}
            <div className="border-b border-gray-200 bg-white px-4 py-3">
              <StatusFilter currentStatus={statusFilter} onChange={handleStatusFilterChange} />
            </div>

            {/* 投稿リスト */}
            <div className="bg-white">
              {posts
                .filter((post, index, arr) => arr.findIndex((p) => p.id === post.id) === index)
                .map((post) => {
                  const isMyPost = currentUser && post.user?.id === currentUser.id;
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const isOptimistic = (post as any)._optimistic;
                  return (
                    <PostCard
                      key={post.id}
                      post={post}
                      showActions={Boolean(isMyPost && !isOptimistic)}
                      onDelete={() => handleDeletePost(post.id)}
                    />
                  );
                })}

              {loading && posts.length === 0 && <PostCardSkeleton count={5} />}

              {!loading && posts.length === 0 && (
                <EmptyState
                  icon={activeTab === 'following' ? Users : MessageCircle}
                  title={
                    activeTab === 'following'
                      ? 'フォロー中のユーザーの投稿がありません'
                      : 'まだ投稿がありません'
                  }
                  description={
                    activeTab === 'following'
                      ? 'ユーザーをフォローして投稿を見てみましょう'
                      : '右下のボタンから投稿してみませんか？'
                  }
                />
              )}
            </div>
          </div>
        </div>
      </PullToRefreshContainer>

      {/* 削除確認モーダル */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setPostToDelete(null);
        }}
        onConfirm={confirmDeletePost}
        title="投稿を削除"
        description="この投稿を削除しますか？この操作は取り消せません。"
        isLoading={deletePost.isPending}
      />
    </div>
  );
}
