'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCurrentUser } from '@/hooks/use-user';
import PostCard from '@/components/post/PostCard';
import StatusFilter from '@/components/timeline/StatusFilter';
import { UserStatus } from '@/types';
import { useQueryClient } from '@tanstack/react-query';
import { usePosts } from '@/hooks/use-posts';
import { useDeletePostMutation } from '@/hooks/use-post';
import { TimelineHeader } from '@/components/layout/TimelineHeader';
import { PullToRefreshContainer } from '@/components/layout/PullToRefreshContainer';
import { DeleteConfirmModal } from '@/components/ui/DeleteConfirmModal';

export default function TimelinePage() {
  const { user } = useAuth();
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
    queryClient.setQueryData(['posts', queryParams], (old: any) => {
      if (!old) return old;
      return {
        ...old,
        posts: old.posts.filter((post: any) => post.id !== postToDelete),
      };
    });

    try {
      await deletePost.mutateAsync({ postId: postToDelete });
    } catch (error: any) {
      console.error('投稿の削除に失敗しました:', error);
      // エラー時は元に戻すため再取得
      await postsQuery.refetch();

      // エラーは無視（削除モーダル内でエラーハンドリング）
    } finally {
      setPostToDelete(null);
    }
  };

  // 投稿データ
  const posts = postsQuery.data?.posts || [];
  const loading = postsQuery.isLoading;

  return (
    <div className="flex flex-col h-screen">
      {/* モバイルヘッダー */}
      <TimelineHeader />

      {/* メインコンテンツ */}
      <div className="flex-1">
        <PullToRefreshContainer onRefresh={handleRefresh}>
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
              .filter(
                (post: any, index: number, arr: any[]) =>
                  arr.findIndex((p: any) => p.id === post.id) === index
              )
              .map((post: any, index: number) => {
                const isMyPost = currentUser && post.user?.id === currentUser.id;
                const isOptimistic = post._optimistic;
                return (
                  <div key={post.id} className={index > 0 ? 'border-t border-gray-200' : ''}>
                    <PostCard
                      post={post}
                      showActions={Boolean(isMyPost && !isOptimistic)}
                      onDelete={() => handleDeletePost(post.id)}
                    />
                  </div>
                );
              })}

            {loading && (
              <div className="text-center py-12 border-t border-gray-200">
                <div className="inline-flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-pink-600"></div>
                  <p className="text-gray-500 text-sm">読み込み中...</p>
                </div>
              </div>
            )}

            {!loading && posts.length === 0 && (
              <div className="text-center py-12 border-t border-gray-200">
                <div className="max-w-sm mx-auto px-4">
                  <p className="text-gray-500 text-lg font-medium mb-2">
                    {activeTab === 'following'
                      ? 'フォロー中のユーザーの投稿がありません'
                      : 'まだ投稿がありません'}
                  </p>
                  <p className="text-gray-400 text-sm">
                    {activeTab === 'following'
                      ? 'ユーザーをフォローして投稿を見てみましょう'
                      : '右下のボタンから投稿してみませんか？'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </PullToRefreshContainer>
      </div>

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
