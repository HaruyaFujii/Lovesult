'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import PostCard from '@/components/post/PostCard';
import PostForm from '@/components/post/PostForm';
import StatusFilter from '@/components/timeline/StatusFilter';
import { UserStatus } from '@/types';
import { useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePosts, useCreatePost } from '@/hooks/use-posts';

export default function TimelinePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<UserStatus | 'all'>('all');
  const [activeTab, setActiveTab] = useState<'all' | 'following'>('all');

  // クエリパラメータを構築
  const queryParams = {
    limit: 20,
    ...(statusFilter !== 'all' && { status: statusFilter }),
    ...(activeTab === 'following' && { tab: 'following' as const }),
  };

  // 投稿データをフェッチ
  const postsQuery = usePosts(queryParams);

  // 投稿作成
  const createPostMutation = useCreatePost();

  const handleCreatePost = async (content: string) => {
    try {
      await createPostMutation.mutateAsync({ content });
    } catch (error) {
      throw new Error('投稿に失敗しました');
    }
  };

  const handleStatusFilterChange = (status: UserStatus | 'all') => {
    setStatusFilter(status);
  };

  const handleTabChange = (tab: 'all' | 'following') => {
    setActiveTab(tab);
  };

  // 投稿データ
  const posts = postsQuery.data?.posts || [];
  const loading = postsQuery.isLoading;


  return (
    <div className="max-w-2xl mx-auto">
      {/* ヘッダー - Twitterライクなスティッキーヘッダー */}
      <div className="sticky top-16 bg-white/80 backdrop-blur-md border-b border-gray-200 z-30 mb-0">
        <div className="px-4 py-3">
          {/* タブ切り替え */}
          <Tabs value={activeTab} onValueChange={handleTabChange as any}>
            <TabsList className="grid w-full grid-cols-2 bg-gray-100">
              <TabsTrigger value="all" className="text-sm">すべて</TabsTrigger>
              <TabsTrigger value="following" className="text-sm">フォロー中</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* 投稿フォーム */}
      {user && (
        <div className="border-b border-gray-200 bg-white">
          <PostForm onSubmit={handleCreatePost} />
        </div>
      )}

      {/* ステータスフィルター */}
      <div className="border-b border-gray-200 bg-white px-4 py-3">
        <StatusFilter currentStatus={statusFilter} onChange={handleStatusFilterChange} />
      </div>

      {/* 投稿リスト */}
      <div className="bg-white">
        {posts
          .filter((post: any, index: number, arr: any[]) => arr.findIndex((p: any) => p.id === post.id) === index)
          .map((post: any, index: number) => (
            <div key={post.id} className={index > 0 ? "border-t border-gray-200" : ""}>
              <PostCard post={post} />
            </div>
          ))}

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
            <div className="max-w-sm mx-auto">
              <p className="text-gray-500 text-lg font-medium mb-2">
                {activeTab === 'following'
                  ? 'フォロー中のユーザーの投稿がありません'
                  : 'まだ投稿がありません'
                }
              </p>
              <p className="text-gray-400 text-sm">
                {activeTab === 'following'
                  ? 'ユーザーをフォローして投稿を見てみましょう'
                  : '最初の投稿をしてみませんか？'
                }
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}