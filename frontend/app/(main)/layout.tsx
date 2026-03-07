'use client';

import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { NotificationBell } from '@/components/NotificationBell';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useCurrentUser } from '@/hooks/use-user';
import {
  Home,
  Search,
  Heart,
  User,
  Users,
  LogOut
} from 'lucide-react';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, signOut } = useAuth();
  const { data: currentUser } = useCurrentUser();
  const router = useRouter();
  const pathname = usePathname();

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const navigationItems = [
    { href: '/timeline', icon: Home, label: 'ホーム' },
    { href: '/search', icon: Search, label: '検索' },
    { href: '/users', icon: Users, label: 'ユーザー' },
  ];

  const isActivePath = (href: string) => {
    if (href === '/timeline') {
      return pathname === '/' || pathname === '/timeline';
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* ヘッダー - シンプルに */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/timeline" className="text-xl font-bold text-pink-600">
              LoveTalk
            </Link>

            {user && (
              <div className="flex items-center space-x-4">
                <NotificationBell />
                <Link href="/profile">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={currentUser?.avatar_url || undefined} />
                    <AvatarFallback>
                      {currentUser?.nickname?.charAt(0) || user.email?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      {/* フッターナビゲーション */}
      {user && (
        <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex justify-around items-center h-16">
              {navigationItems.map((item) => {
                const isActive = isActivePath(item.href);
                const IconComponent = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex flex-col items-center justify-center h-full px-3 transition-colors ${
                      isActive
                        ? 'text-pink-600'
                        : 'text-gray-600 hover:text-pink-600'
                    }`}
                  >
                    <IconComponent
                      className={`h-5 w-5 mb-1 ${isActive ? 'fill-current' : ''}`}
                    />
                    <span className="text-xs font-medium">{item.label}</span>
                  </Link>
                );
              })}

              {/* プロフィール/その他メニュー */}
              <div className="flex flex-col items-center justify-center h-full px-3">
                <div className="relative group">
                  <Button
                    variant="ghost"
                    className="flex flex-col items-center justify-center h-full p-0"
                  >
                    <User className="h-5 w-5 mb-1 text-gray-600 group-hover:text-pink-600" />
                    <span className="text-xs font-medium text-gray-600 group-hover:text-pink-600">その他</span>
                  </Button>

                  {/* ドロップダウンメニュー */}
                  <div className="absolute bottom-16 right-0 mb-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <div className="py-2">
                      <Link
                        href="/profile"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <User className="h-4 w-4 mr-3" />
                        プロフィール
                      </Link>
                      <Link
                        href="/settings"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <User className="h-4 w-4 mr-3" />
                        設定
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                      >
                        <LogOut className="h-4 w-4 mr-3" />
                        ログアウト
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}