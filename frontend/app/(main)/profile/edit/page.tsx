'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useCurrentUser, useUpdateProfile } from '@/hooks/use-user';
import { User, UserStatus, Gender, AgeRange } from '@/types';

export default function ProfileEditPage() {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [nickname, setNickname] = useState('');
  const [status, setStatus] = useState<UserStatus>('SEEKING');
  const [gender, setGender] = useState<Gender>('PRIVATE');
  const [ageRange, setAgeRange] = useState<AgeRange>('TWENTIES');
  const [bio, setBio] = useState('');
  const [error, setError] = useState('');

  // Orvalで生成されたフックを使用
  const { data: profileData } = useCurrentUser(!!user);
  const updateProfileMutation = useUpdateProfile();

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
  }, [user, router]);

  const initializedRef = useRef(false);

  // プロフィールデータが読み込まれた時にフォームに設定
  useEffect(() => {
    if (profileData && !initializedRef.current) {
      // 実際のレスポンスは直接ユーザーオブジェクトが返される
      const profile = profileData as User;

      setNickname(profile.nickname || '');
      setStatus(profile.status || 'SEEKING');
      setGender(profile.gender || 'PRIVATE');
      setAgeRange(profile.age_range || 'TWENTIES');
      setBio(profile.bio || '');
      initializedRef.current = true;
    }
  }, [profileData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const profileData = {
        nickname,
        status,
        gender,
        age_range: ageRange,
        bio: bio || null,
      };

      await updateProfileMutation.mutateAsync(profileData);

      // キャッシュを無効化してプロフィール表示ページで最新データを取得
      await queryClient.invalidateQueries({ queryKey: ['/api/v1/users/me'] });
      // さらに強制的にリフェッチ
      await queryClient.refetchQueries({ queryKey: ['/api/v1/users/me'] });

      router.push('/profile');
    } catch (error) {
      console.error('Profile update error:', error);
      let errorMessage = 'プロフィールの更新に失敗しました';

      // エラーの構造を詳しく確認してメッセージを抽出
      if (error?.data?.detail) {
        // customInstanceのエラー形式
        if (Array.isArray(error.data.detail)) {
          // バリデーションエラーの場合、最初のエラーメッセージを使用
          errorMessage = error.data.detail[0]?.msg || errorMessage;
        } else {
          errorMessage = error.data.detail;
        }
      } else if (error?.message) {
        if (Array.isArray(error.message)) {
          errorMessage = error.message[0]?.msg || error.message[0] || errorMessage;
        } else {
          errorMessage = error.message;
        }
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      setError(errorMessage);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">プロフィール編集</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="nickname" className="block text-sm font-medium text-gray-700">
              ニックネーム *
            </label>
            <input
              type="text"
              id="nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={20}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
            />
            <p className="mt-1 text-sm text-gray-500">1〜20文字</p>
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
              ステータス *
            </label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as UserStatus)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
            >
              <option value="IN_LOVE">恋愛中</option>
              <option value="HEARTBROKEN">失恋中</option>
              <option value="SEEKING">探し中</option>
            </select>
          </div>

          <div>
            <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
              性別
            </label>
            <select
              id="gender"
              value={gender}
              onChange={(e) => setGender(e.target.value as Gender)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
            >
              <option value="MALE">男性</option>
              <option value="FEMALE">女性</option>
              <option value="OTHER">その他</option>
              <option value="PRIVATE">非公開</option>
            </select>
          </div>

          <div>
            <label htmlFor="ageRange" className="block text-sm font-medium text-gray-700">
              年代 *
            </label>
            <select
              id="ageRange"
              value={ageRange}
              onChange={(e) => setAgeRange(e.target.value as AgeRange)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
            >
              <option value="TEENS">10代</option>
              <option value="TWENTIES">20代</option>
              <option value="THIRTIES">30代</option>
              <option value="FORTIES">40代</option>
              <option value="FIFTIES_PLUS">50代以上</option>
            </select>
          </div>

          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
              自己紹介
            </label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={200}
              rows={4}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
            />
            <p className="mt-1 text-sm text-gray-500">200文字以内</p>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.push('/profile')}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={updateProfileMutation.isPending}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updateProfileMutation.isPending ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
