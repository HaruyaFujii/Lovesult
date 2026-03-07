'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCurrentUser } from '@/hooks/use-user';
import { AvatarUpload } from '@/components/AvatarUpload';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Users, MessageCircle, Settings } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';
import { getUserStatusLabel, getGenderLabel, getAgeRangeLabel } from '@/lib/utils/enum-labels';

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string>("");

  const { data: profileData, isLoading, error } = useCurrentUser(!!user && !authLoading);
  // 実際のレスポンスは直接ユーザーオブジェクトが返される
  const profile = profileData as any;


  // 認証チェックをuseEffectで行う
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  if (authLoading) {
    return <div className="text-center py-8">認証確認中...</div>;
  }

  if (!user) {
    return <div className="text-center py-8">リダイレクト中...</div>;
  }

  if (isLoading) {
    return <div className="text-center py-8">読み込み中...</div>;
  }

  if (error || !profile) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 mb-4">プロフィールが見つかりません</p>
        <Link
          href="/profile/edit"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-pink-600 hover:bg-pink-700"
        >
          プロフィールを作成
        </Link>
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
            <AvatarUpload
              currentAvatarUrl={profile?.avatar_url || ""}
              userName={profile.name || profile.nickname}
              userId={profile.id}
              onAvatarUpdate={setCurrentAvatarUrl}
            />

            {/* プロフィール情報 */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {profile.name || profile.nickname || "名前未設定"}
                  </h1>
                  <p className="text-gray-600">{profile.email}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" asChild>
                    <Link href="/profile/edit">
                      プロフィール編集
                    </Link>
                  </Button>
                  <Button variant="outline" size="icon" asChild>
                    <Link href="/settings">
                      <Settings className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>

              {/* ステータスと年代 */}
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="secondary">
                  {getUserStatusLabel(profile.status)}
                </Badge>
                {profile.age_range && (
                  <Badge variant="outline">
                    {getAgeRangeLabel(profile.age_range)}
                  </Badge>
                )}
                {profile.gender && (
                  <Badge variant="outline">
                    {getGenderLabel(profile.gender)}
                  </Badge>
                )}
              </div>

              {/* 自己紹介 */}
              {profile.bio && (
                <p className="text-gray-700 mb-4">{profile.bio}</p>
              )}

              {/* 統計情報 */}
              <div className="flex items-center gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <MessageCircle className="h-4 w-4" />
                  <span>{profile.posts_count || 0} 投稿</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{profile.followers_count || 0} フォロワー</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{profile.following_count || 0} フォロー中</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {profile.created_at && !isNaN(new Date(profile.created_at).getTime())
                      ? formatDistanceToNow(new Date(profile.created_at), {
                          addSuffix: true,
                          locale: ja,
                        })
                      : '不明'
                    }
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
          <CardTitle>アクティビティ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-8">
            投稿一覧とアクティビティは実装予定です
          </div>
        </CardContent>
      </Card>
    </div>
  );
}