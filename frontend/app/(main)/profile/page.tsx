'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useCurrentUser } from '@/hooks/use-user';
import { useMyPersonalityResult } from '@/hooks/use-personality';
import { useUserPosts } from '@/hooks/use-user-posts';
import { useDeletePostMutation } from '@/hooks/use-post';
import { AvatarUpload } from '@/components/AvatarUpload';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageCircle } from 'lucide-react';
import PostCard from '@/components/post/PostCard';
import PostCardSkeleton from '@/components/post/PostCardSkeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { getUserStatusLabel, getGenderLabel, getAgeRangeLabel } from '@/lib/utils/enum-labels';
import { MobileHeader } from '@/components/layout/MobileHeader';
import { PullToRefreshContainer } from '@/components/layout/PullToRefreshContainer';
import { DeleteConfirmModal } from '@/components/ui/DeleteConfirmModal';

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const deletePost = useDeletePostMutation();

  const { data: profileData, isLoading, error } = useCurrentUser(!!user && !authLoading);
  const { data: personalityResult } = useMyPersonalityResult();
  // 実際のレスポンスは直接ユーザーオブジェクトが返される
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const profile = profileData as any;
  const userId: string | undefined = profile?.id;

  const userPostsQuery = useUserPosts(userId || '', { limit: 20 }, !!userId);
  const posts = userPostsQuery.data?.posts || [];
  const postsLoading = userPostsQuery.isLoading;

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);

  // 認証チェックをuseEffectで行う
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  const handleRefresh = async () => {
    await Promise.all([userPostsQuery.refetch()]);
  };

  const handleDeletePost = (postId: string) => {
    setPostToDelete(postId);
    setDeleteModalOpen(true);
  };

  const confirmDeletePost = async () => {
    if (!postToDelete) return;
    // 楽観的更新
    queryClient.setQueriesData({ queryKey: ['userPosts', userId] }, (old: unknown) => {
      const oldData = old as { posts: Array<{ id: string }> } | undefined;
      if (!oldData) return oldData;
      return {
        ...oldData,
        posts: oldData.posts.filter((p) => p.id !== postToDelete),
      };
    });
    try {
      await deletePost.mutateAsync({ postId: postToDelete });
    } catch (err) {
      console.error('投稿の削除に失敗しました:', err);
      await userPostsQuery.refetch();
      toast.error('投稿の削除に失敗しました');
    } finally {
      setPostToDelete(null);
    }
  };

  if (authLoading || !user || isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <MobileHeader />
        <div className="max-w-xl mx-auto w-full sm:border-x border-gray-200 bg-white pb-20">
          <div className="px-4 pt-4">
            <div className="flex items-start justify-between">
              <Skeleton className="h-20 w-20 rounded-full" />
              <Skeleton className="h-8 w-32 rounded-full" />
            </div>
            <div className="mt-3 space-y-2">
              <Skeleton className="h-6 w-40 rounded" />
              <Skeleton className="h-4 w-56 rounded" />
              <Skeleton className="h-4 w-full rounded" />
              <div className="flex gap-4 mt-3">
                <Skeleton className="h-4 w-20 rounded" />
                <Skeleton className="h-4 w-20 rounded" />
              </div>
            </div>
          </div>
          <div className="mt-4 border-b border-gray-200 px-4 py-3">
            <Skeleton className="h-5 w-20 rounded" />
          </div>
          <PostCardSkeleton count={3} />
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <MobileHeader />
        <div className="max-w-xl mx-auto w-full sm:border-x border-gray-200 bg-white pb-20">
          <EmptyState
            title="プロフィールが見つかりません"
            description="プロフィールを作成して始めましょう"
            action={
              <Link
                href="/profile/edit"
                className="inline-flex items-center rounded-full bg-pink-600 px-4 py-1.5 text-sm font-bold text-white hover:bg-pink-700"
              >
                プロフィールを作成
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  const displayName = profile.name || profile.nickname || '名前未設定';
  const followingCount = profile.following_count;
  const followersCount = profile.followers_count;
  const hasFollowCounts = typeof followingCount === 'number' && typeof followersCount === 'number';

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <MobileHeader />
      <PullToRefreshContainer onRefresh={handleRefresh}>
        <div className="pb-20">
          <div className="max-w-xl mx-auto sm:border-x border-gray-200 bg-white">
            {/* ヘッダーブロック */}
            <div className="px-4 pt-4 pb-3">
              <div className="flex items-start justify-between gap-4">
                <AvatarUpload
                  currentAvatarUrl={profile?.avatar_url || ''}
                  userName={displayName}
                  userId={profile.id}
                  onAvatarUpdate={() => {
                    // 反映は AvatarUpload 側でクエリ無効化済み
                  }}
                />
                <Link
                  href="/profile/edit"
                  className="rounded-full border border-gray-300 bg-white px-4 py-1.5 text-sm font-bold text-gray-900 transition-colors hover:bg-gray-50"
                >
                  プロフィールを編集
                </Link>
              </div>

              {/* 名前ブロック */}
              <div className="mt-3">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-bold text-gray-900 truncate">{displayName}</h1>
                  {profile.status && (
                    <Badge variant="secondary" className="text-[11px] px-2 py-0.5">
                      {getUserStatusLabel(profile.status)}
                    </Badge>
                  )}
                </div>
                <div className="mt-1 text-sm text-gray-500">
                  {[
                    profile.age_range && getAgeRangeLabel(profile.age_range),
                    profile.gender && getGenderLabel(profile.gender),
                  ]
                    .filter(Boolean)
                    .join(' ・ ')}
                </div>
              </div>

              {/* bio */}
              {profile.bio && (
                <p className="mt-2 text-[15px] text-gray-900 whitespace-pre-wrap break-words">
                  {profile.bio}
                </p>
              )}

              {/* メタ行(フォロー数) */}
              {hasFollowCounts && (
                <div className="mt-3 flex gap-4 text-sm">
                  <span>
                    <span className="font-bold text-gray-900">{followingCount}</span>{' '}
                    <span className="text-gray-500">フォロー中</span>
                  </span>
                  <span>
                    <span className="font-bold text-gray-900">{followersCount}</span>{' '}
                    <span className="text-gray-500">フォロワー</span>
                  </span>
                </div>
              )}

              {/* 性格診断結果(控えめ) */}
              {personalityResult && (
                <Link
                  href="/personality/result"
                  className="mt-3 flex items-center gap-2 rounded-lg bg-gradient-to-r from-pink-50 to-purple-50 px-3 py-2 text-sm transition-colors hover:from-pink-100 hover:to-purple-100"
                >
                  <span className="text-lg">{personalityResult.primary_type.emoji}</span>
                  <span className="font-semibold text-gray-900">
                    {personalityResult.primary_type.name}
                  </span>
                  <span className="text-xs text-gray-500 ml-auto">診断結果を見る</span>
                </Link>
              )}
            </div>

            {/* タブ風の見出し */}
            <div className="flex border-b border-gray-200">
              <div className="flex-1 py-3 text-center text-sm font-bold text-gray-900 border-b-2 border-pink-500">
                投稿
              </div>
            </div>

            {/* 投稿リスト */}
            <div className="bg-white">
              {posts
                .filter((post, index, arr) => arr.findIndex((p) => p.id === post.id) === index)
                .map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    showActions={true}
                    onDelete={() => handleDeletePost(post.id)}
                  />
                ))}

              {postsLoading && posts.length === 0 && <PostCardSkeleton count={3} />}

              {!postsLoading && posts.length === 0 && (
                <EmptyState
                  icon={MessageCircle}
                  title="まだ投稿がありません"
                  description="最初の投稿をしてみませんか？"
                />
              )}
            </div>
          </div>
        </div>
      </PullToRefreshContainer>

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
