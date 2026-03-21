'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCurrentUser } from '@/hooks/use-user';
import { useMyPersonalityResult } from '@/hooks/use-personality';
import { AvatarUpload } from '@/components/AvatarUpload';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Users, MessageCircle, Settings, Heart, Star } from 'lucide-react';
import { formatDistanceToNowJST } from '@/lib/utils/date';
import {
  getUserStatusLabel,
  getGenderLabel,
  getAgeRangeLabel,
  getPersonalityTypeLabel,
} from '@/lib/utils/enum-labels';
import { MobileHeader } from '@/components/layout/MobileHeader';
import { PullToRefreshContainer } from '@/components/layout/PullToRefreshContainer';

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const { data: profileData, isLoading, error } = useCurrentUser(!!user && !authLoading);
  const { data: personalityResult } = useMyPersonalityResult();
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
    <div className="flex flex-col h-screen">
      {/* モバイルヘッダー */}
      <MobileHeader />

      {/* メインコンテンツ */}
      <div className="flex-1">
        <PullToRefreshContainer onRefresh={async () => {}}>
          <div className="space-y-4 px-4 py-4">
            {/* プロフィールヘッダー */}
            <Card>
              <CardHeader>
                <div className="flex items-start gap-6">
                  {/* プロフィール情報 - モバイル最適化 */}
                  <div className="flex flex-col space-y-4">
                    {/* アバターと基本情報 */}
                    <div className="flex items-center gap-4">
                      <AvatarUpload
                        currentAvatarUrl={profile?.avatar_url || ''}
                        userName={profile.name || profile.nickname}
                        userId={profile.id}
                        onAvatarUpdate={() => {
                          // アバター更新後の処理（必要に応じて）
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <h1 className="text-xl font-bold text-gray-900 truncate">
                          {profile.name || profile.nickname || '名前未設定'}
                        </h1>
                        <p className="text-sm text-gray-600 truncate">{profile.email}</p>
                      </div>
                    </div>

                    {/* アクションボタン */}
                    <div className="flex gap-2">
                      <Button variant="outline" asChild className="flex-1">
                        <Link href="/profile/edit">プロフィール編集</Link>
                      </Button>
                      <Button variant="outline" size="icon" asChild>
                        <Link href="/settings">
                          <Settings className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>

                    {/* ステータスと年代 */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary">{getUserStatusLabel(profile.status)}</Badge>
                      {profile.age_range && (
                        <Badge variant="outline">{getAgeRangeLabel(profile.age_range)}</Badge>
                      )}
                      {profile.gender && (
                        <Badge variant="outline">{getGenderLabel(profile.gender)}</Badge>
                      )}
                    </div>

                    {/* 自己紹介 */}
                    {profile.bio && (
                      <p className="text-gray-700 text-sm leading-relaxed">{profile.bio}</p>
                    )}

                    {/* 統計情報 */}
                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
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
                            ? formatDistanceToNowJST(profile.created_at)
                            : '不明'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* 性格診断結果 */}
            {personalityResult ? (
              <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{personalityResult.primary_type.emoji}</div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      {personalityResult.primary_type.name}
                    </h3>
                    <p className="text-sm text-gray-600">恋愛タイプ診断結果</p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/personality/result">詳細を見る</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Heart className="h-8 w-8 text-pink-400" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">恋愛タイプ診断</h3>
                    <p className="text-sm text-gray-600">あなたの恋愛傾向を診断してみませんか？</p>
                  </div>
                  <Button asChild>
                    <Link href="/personality">診断する</Link>
                  </Button>
                </div>
              </div>
            )}

            {/* 性格診断詳細（結果がある場合のみ） */}
            {personalityResult && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Star className="h-5 w-5 text-yellow-500" />
                    恋愛タイプ診断詳細
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* プライマリタイプ */}
                    <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg">
                      <div className="text-3xl">{personalityResult.primary_type.emoji}</div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900">
                          {personalityResult.primary_type.name}
                        </h3>
                        <p className="text-sm text-gray-700 mt-1">
                          {personalityResult.primary_type.description}
                        </p>
                      </div>
                    </div>

                    {/* サブタイプ */}
                    {personalityResult.secondary_type && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="text-2xl">{personalityResult.secondary_type.emoji}</div>
                        <div>
                          <p className="text-xs text-gray-600">サブタイプ</p>
                          <p className="font-semibold text-sm">
                            {personalityResult.secondary_type.name}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* スコア */}
                    <div>
                      <h4 className="font-semibold mb-3 text-sm">性格スコア</h4>
                      <div className="grid grid-cols-1 gap-2">
                        {Object.entries(personalityResult.scores).map(([type, score]) => (
                          <div
                            key={type}
                            className="flex items-center justify-between bg-gray-50 rounded p-2"
                          >
                            <span className="text-sm">{getPersonalityTypeLabel(type)}</span>
                            <div className="flex items-center gap-2">
                              <div className="w-12 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-pink-500 h-2 rounded-full"
                                  style={{ width: `${(score / 20) * 100}%` }}
                                />
                              </div>
                              <span className="text-xs font-medium w-6">{score}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" asChild className="flex-1 text-sm">
                        <Link href="/personality/result">詳細結果</Link>
                      </Button>
                      <Button variant="outline" asChild className="flex-1 text-sm">
                        <Link href="/personality">再診断</Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* アクティビティエリア */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">アクティビティ</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center text-gray-500 py-8">
                  <p className="text-sm">投稿一覧とアクティビティは実装予定です</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </PullToRefreshContainer>
      </div>
    </div>
  );
}
