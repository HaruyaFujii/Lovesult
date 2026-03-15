'use client';

import { useMyPersonalityResult, useRecommendedUsers } from '@/hooks/use-personality';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Loader2, RotateCw, Users } from 'lucide-react';
import Link from 'next/link';

export default function PersonalityResultPage() {
  const { data: result, isLoading: resultLoading } = useMyPersonalityResult();
  const { data: recommendedUsers, isLoading: usersLoading } = useRecommendedUsers(5);

  if (resultLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!result) {
    return (
      <div className="max-w-lg mx-auto text-center">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
          <p className="text-gray-600 mb-4">まだ診断を受けていません</p>
          <Link href="/personality">
            <Button>診断を受ける</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-center mb-6">あなたの診断結果</h1>

      {/* メインタイプ */}
      <div
        className="bg-white rounded-lg shadow-sm border-2 p-6 mb-4"
        style={{ borderColor: result.primary_type.color }}
      >
        <div className="text-center mb-4">
          <div className="text-6xl mb-3">{result.primary_type.emoji}</div>
          <h2 className="text-2xl font-bold mb-2">{result.primary_type.name}</h2>
          <div
            className="inline-block px-3 py-1 rounded-full text-white text-sm font-medium"
            style={{ backgroundColor: result.primary_type.color }}
          >
            あなたのタイプ
          </div>
        </div>
        <p className="text-gray-700 leading-relaxed">
          {result.primary_type.description}
        </p>
      </div>

      {/* サブタイプ */}
      {result.secondary_type && (
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-600 mb-2">サブタイプ</p>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{result.secondary_type.emoji}</span>
            <span className="font-semibold">{result.secondary_type.name}</span>
          </div>
        </div>
      )}

      {/* スコア */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <h3 className="font-semibold mb-3">詳細スコア</h3>
        <div className="space-y-2">
          {Object.entries(result.scores).map(([type, score]) => (
            <div key={type} className="flex items-center justify-between">
              <span className="text-sm capitalize">{type}</span>
              <div className="flex items-center gap-2">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-pink-500 h-2 rounded-full"
                    style={{ width: `${(score / 20) * 100}%` }}
                  />
                </div>
                <span className="text-sm text-gray-600 w-8">{score}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* おすすめユーザー */}
      <div className="mb-6">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Users className="h-5 w-5" />
          相性の良いユーザー
        </h3>
        {usersLoading ? (
          <div className="text-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400 mx-auto" />
          </div>
        ) : recommendedUsers?.users.length ? (
          <div className="space-y-3">
            {recommendedUsers.users.map((user) => (
              <Link key={user.id} href={`/profile/${user.id}`}>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.avatar_url || undefined} />
                      <AvatarFallback>{user.nickname?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{user.nickname}</span>
                        <span className="text-lg">{user.personality_emoji}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500">相性度</span>
                        <div className="flex gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <span
                              key={i}
                              className={
                                i < Math.round(user.compatibility_score * 5)
                                  ? 'text-pink-500'
                                  : 'text-gray-300'
                              }
                            >
                              ♥
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">おすすめユーザーが見つかりませんでした</p>
        )}
      </div>

      {/* もう一度診断 */}
      <Link href="/personality">
        <Button variant="outline" className="w-full">
          <RotateCw className="mr-2 h-4 w-4" />
          もう一度診断する
        </Button>
      </Link>
    </div>
  );
}