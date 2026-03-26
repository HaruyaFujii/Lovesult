'use client';

import { useParams } from 'next/navigation';
import { useUserProfile } from '@/hooks/use-user';
import { useUserPersonalityResult } from '@/hooks/use-personality';
// import { useCreateConversation } from '@/hooks/use-dm';
import { FollowButton } from '@/components/FollowButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Calendar, Users, MessageCircle, Heart, Star, AlertCircle } from 'lucide-react';
import { formatDistanceToNowJST } from '@/lib/utils/date';
import {
  getUserStatusLabel,
  getGenderLabel,
  getAgeRangeLabel,
  getPersonalityTypeLabel,
} from '@/lib/utils/enum-labels';

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;

  const { data: profile, isLoading, error } = useUserProfile(userId);
  const { data: personalityResult } = useUserPersonalityResult(userId);
  // const { mutate: createConversation, isPending: isCreatingConversation } = useCreateConversation();

  // const handleSendMessage = () => {
  //   createConversation(userId, {
  //     onSuccess: (conversation) => {
  //       router.push(`/messages/${conversation.id}`);
  //     },
  //     onError: () => {
  //       // エラーハンドリングは必要に応じて追加
  //     },
  //   });
  // };

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
              <AvatarImage src={(profile as any)?.data?.avatar_url || undefined} />
              <AvatarFallback>{(profile as any)?.data?.nickname?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>

            {/* プロフィール情報 */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {(profile as any)?.data?.nickname || '名前未設定'}
                  </h1>
                  <p className="text-gray-600">{(profile as any)?.data?.email}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    disabled={true}
                    className="gap-2"
                    variant="outline"
                    title="電気通信事業の届出が必要なため、現在利用不可"
                  >
                    <AlertCircle className="h-4 w-4" />
                    メッセージ（利用不可）
                  </Button>
                  <FollowButton userId={userId} />
                </div>
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
                  <Badge variant="outline">{getGenderLabel((profile as any).data.gender)}</Badge>
                )}
              </div>

              {/* 自己紹介 */}
              {(profile as any)?.data?.bio && (
                <p className="text-gray-700 mb-4">{(profile as any).data.bio}</p>
              )}

              {/* 性格診断結果 */}
              {personalityResult ? (
                <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{personalityResult.primary_type.emoji}</div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">
                        {personalityResult.primary_type.name}
                      </h3>
                      <p className="text-sm text-gray-600">恋愛タイプ診断結果</p>
                      {personalityResult.secondary_type && (
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-lg">{personalityResult.secondary_type.emoji}</span>
                          <span className="text-xs text-gray-500">
                            サブ: {personalityResult.secondary_type.name}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-3 mb-4 text-center">
                  <Heart className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                  <p className="text-sm text-gray-500">まだ性格診断を受けていません</p>
                </div>
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
                  <span>{formatDistanceToNowJST((profile as any)?.data?.created_at)}</span>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* 性格診断詳細（結果がある場合のみ） */}
      {personalityResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              恋愛タイプ診断結果
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* プライマリタイプ */}
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg">
                <div className="text-4xl">{personalityResult.primary_type.emoji}</div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900">
                    {personalityResult.primary_type.name}
                  </h3>
                  <p className="text-gray-700 mt-1">{personalityResult.primary_type.description}</p>
                </div>
              </div>

              {/* サブタイプ */}
              {personalityResult.secondary_type && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl">{personalityResult.secondary_type.emoji}</div>
                  <div>
                    <p className="text-sm text-gray-600">サブタイプ</p>
                    <p className="font-semibold">{personalityResult.secondary_type.name}</p>
                  </div>
                </div>
              )}

              {/* スコア */}
              <div>
                <h4 className="font-semibold mb-3">性格スコア</h4>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(personalityResult.scores).map(([type, score]) => (
                    <div
                      key={type}
                      className="flex items-center justify-between bg-gray-50 rounded p-2"
                    >
                      <span className="text-sm">{getPersonalityTypeLabel(type)}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-pink-500 h-2 rounded-full"
                            style={{ width: `${(score / 20) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-6">{score}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* タブエリア（将来の投稿一覧など用） */}
      <Card>
        <CardHeader>
          <CardTitle>投稿</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-8">投稿一覧は実装予定です</div>
        </CardContent>
      </Card>
    </div>
  );
}
