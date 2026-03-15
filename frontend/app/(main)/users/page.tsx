'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useUsers, type User } from '@/hooks/use-users';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Users } from 'lucide-react';
import Link from 'next/link';

export default function UsersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: usersData, isLoading, error } = useUsers();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  const filteredUsers =
    usersData?.users?.filter(
      (user: User) =>
        user.nickname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.bio?.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_love':
        return 'bg-pink-500';
      case 'heartbroken':
        return 'bg-blue-500';
      case 'seeking':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'in_love':
        return '恋愛中';
      case 'heartbroken':
        return '失恋中';
      case 'seeking':
        return '探し中';
      default:
        return status;
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">ユーザー一覧の読み込みに失敗しました</div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Users className="h-6 w-6 text-pink-600" />
            <h1 className="text-2xl font-bold">ユーザー一覧</h1>
          </div>
          <div className="text-sm text-gray-500">{filteredUsers.length} 人のユーザー</div>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="text"
              placeholder="ユーザーを検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="space-y-4">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">ユーザーが見つかりません</div>
          ) : (
            filteredUsers.map((user: User) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Link href={`/users/${user.id}`} className="flex items-center gap-4 flex-1">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={user.avatar_url} />
                    <AvatarFallback>
                      {user.nickname?.charAt(0) || user.email?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{user.nickname || 'ユーザー'}</h3>
                      <Badge
                        variant="secondary"
                        className={`${getStatusColor(user.status)} text-white`}
                      >
                        {getStatusLabel(user.status)}
                      </Badge>
                    </div>
                    {user.bio && <p className="text-sm text-gray-600 line-clamp-1">{user.bio}</p>}
                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                      <span>{user.followers_count} フォロワー</span>
                      <span>{user.following_count} フォロー中</span>
                    </div>
                  </div>
                </Link>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
