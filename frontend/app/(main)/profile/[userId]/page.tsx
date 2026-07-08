'use client';

import { useParams } from 'next/navigation';
import { useUserProfile } from '@/hooks/use-user';
import { useUserPersonalityResult } from '@/hooks/use-personality';
import { useUserPosts } from '@/hooks/use-user-posts';
import { FollowButton } from '@/components/FollowButton';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageCircle } from 'lucide-react';
import PostCard from '@/components/post/PostCard';
import PostCardSkeleton from '@/components/post/PostCardSkeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { getUserStatusLabel, getGenderLabel, getAgeRangeLabel } from '@/lib/utils/enum-labels';
import { MobileHeader } from '@/components/layout/MobileHeader';
import { PullToRefreshContainer } from '@/components/layout/PullToRefreshContainer';

export default function UserProfilePage() {
  const params = useParams();
  const userId = params.userId as string;

  const { data: profileData, isLoading, error } = useUserProfile(userId);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const profile = profileData as any;
  const { data: personalityResult } = useUserPersonalityResult(userId);
  const userPostsQuery = useUserPosts(userId, { limit: 20 }, !!userId);
  const posts = userPostsQuery.data?.posts || [];
  const postsLoading = userPostsQuery.isLoading;

  const handleRefresh = async () => {
    await Promise.all([userPostsQuery.refetch()]);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <MobileHeader />
        <div className="max-w-xl mx-auto w-full sm:border-x border-gray-200 bg-white pb-20">
          <div className="px-4 pt-4">
            <div className="flex items-start justify-between">
              <Skeleton className="h-20 w-20 rounded-full" />
              <Skeleton className="h-8 w-24 rounded-full" />
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
          <EmptyState title="プロフィールが見つかりません" />
        </div>
      </div>
    );
  }

  const displayName = profile?.nickname || '名前未設定';
  const followingCount = profile?.following_count;
  const followersCount = profile?.followers_count;
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
                <Avatar className="h-20 w-20 flex-shrink-0">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="text-xl">
                    {profile?.nickname?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-shrink-0">
                  <FollowButton userId={userId} />
                </div>
              </div>

              {/* 名前ブロック */}
              <div className="mt-3">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-bold text-gray-900 truncate">{displayName}</h1>
                  {profile?.status && (
                    <Badge variant="secondary" className="text-[11px] px-2 py-0.5">
                      {getUserStatusLabel(profile.status)}
                    </Badge>
                  )}
                </div>
                <div className="mt-1 text-sm text-gray-500">
                  {[
                    profile?.age_range && getAgeRangeLabel(profile.age_range),
                    profile?.gender && getGenderLabel(profile.gender),
                  ]
                    .filter(Boolean)
                    .join(' ・ ')}
                </div>
              </div>

              {/* bio */}
              {profile?.bio && (
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
                <div className="mt-3 flex items-center gap-2 rounded-lg bg-gradient-to-r from-pink-50 to-purple-50 px-3 py-2 text-sm">
                  <span className="text-lg">{personalityResult.primary_type.emoji}</span>
                  <span className="font-semibold text-gray-900">
                    {personalityResult.primary_type.name}
                  </span>
                  {personalityResult.secondary_type && (
                    <span className="ml-auto text-xs text-gray-500">
                      サブ: {personalityResult.secondary_type.name}
                    </span>
                  )}
                </div>
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
                  <PostCard key={post.id} post={post} showActions={false} />
                ))}

              {postsLoading && posts.length === 0 && <PostCardSkeleton count={3} />}

              {!postsLoading && posts.length === 0 && (
                <EmptyState
                  icon={MessageCircle}
                  title="まだ投稿がありません"
                  description="このユーザーはまだ投稿していません"
                />
              )}
            </div>
          </div>
        </div>
      </PullToRefreshContainer>
    </div>
  );
}
