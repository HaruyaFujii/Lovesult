'use client';

import { useParams } from 'next/navigation';
import { useUserProfile } from '@/hooks/use-user';
import { FollowButton } from '@/components/FollowButton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, Users, MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';
import { getUserStatusLabel, getGenderLabel, getAgeRangeLabel } from '@/lib/utils/enum-labels';

export default function UserProfilePage() {
  const params = useParams();
  const userId = params.userId as string;

  const { data: profile, isLoading, error } = useUserProfile(userId);

  if (isLoading) {
    return <div className="text-center py-8">読み込み中...</div>;
  }

  if (error || !profile) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 mb-4">プロフィールが見つかりません</p>
      </div>
    );
  }


  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* プロフィールヘッダー */}
      <Card>
        <CardHeader>
          <div className="flex items-start gap-6">
            {/* アバター */}
            <Avatar className="h-20 w-20">
              <AvatarImage
                src={(profile as any)?.data?.avatar_url || undefined}
              />
              <AvatarFallback>
                {(profile as any)?.data?.nickname?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>

            {/* プロフィール情報 */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {(profile as any)?.data?.nickname || "名前未設定"}
                  </h1>
                  <p className="text-gray-600">{(profile as any)?.data?.email}</p>
                </div>
                <FollowButton userId={userId} />
              </div>

              {/* ステータスと年代 */}
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="secondary">
                  {getUserStatusLabel((profile as any)?.data?.status)}
                </Badge>
                {(profile as any)?.data?.age_range && (
                  <Badge variant="outline">
                    {getAgeRangeLabel((profile as any).data.age_range)}
                  </Badge>
                )}
                {(profile as any)?.data?.gender && (
                  <Badge variant="outline">
                    {getGenderLabel((profile as any).data.gender)}
                  </Badge>
                )}
              </div>

              {/* 自己紹介 */}
              {(profile as any)?.data?.bio && (
                <p className="text-gray-700 mb-4">{(profile as any).data.bio}</p>
              )}

              {/* 統計情報 */}
              <div className="flex items-center gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <MessageCircle className="h-4 w-4" />
                  <span>{(profile as any)?.data?.posts_count || 0} 投稿</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{(profile as any)?.data?.followers_count || 0} フォロワー</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{(profile as any)?.data?.following_count || 0} フォロー中</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {formatDistanceToNow(new Date((profile as any)?.data?.created_at), {
                      addSuffix: true,
                      locale: ja,
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* タブエリア（将来の投稿一覧など用） */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-bold">投稿</h2>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-8">
            投稿一覧は実装予定です
          </div>
        </CardContent>
      </Card>
    </div>
  );
}