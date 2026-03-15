'use client';

import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCurrentUser } from '@/hooks/use-user';
import { useCreatePost } from '@/hooks/use-posts';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getUserStatusLabel } from '@/lib/utils/enum-labels';
import { User } from '@/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const MAX_LENGTH = 500;

export function CreatePostModal({ isOpen, onClose }: Props) {
  const { user } = useAuth();
  const { data: currentUser, isLoading: userLoading } = useCurrentUser();

  // UserResponseをUserに変換
  const userForPost: User | undefined = currentUser ? {
    id: currentUser.id,
    email: currentUser.email || '',
    nickname: currentUser.nickname,
    name: currentUser.nickname,  // nameフィールドがない場合はnicknameを使用
    avatar_url: currentUser.avatar_url || undefined,
    status: currentUser.status,
    gender: currentUser.gender,
    age_range: currentUser.age_range,
    bio: currentUser.bio || undefined,
    created_at: currentUser.created_at || new Date().toISOString(),
    updated_at: currentUser.updated_at || undefined
  } : undefined;

  const createPost = useCreatePost(userForPost);
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // モーダルを開いたときにテキストエリアにフォーカス
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // モーダルを開いているときはbodyスクロールを無効化
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!content.trim() || createPost.isPending) return;

    const contentToSubmit = content.trim();

    // UX優先：即座にモーダルを閉じる
    setContent('');
    setError(null);
    onClose();

    // バックグラウンドで投稿処理
    try {
      await createPost.mutateAsync({ content: contentToSubmit });
    } catch (error) {
      console.error('投稿エラー:', error);
      // エラーが発生した場合は、トースト通知や別の方法でユーザーに知らせる
      // ここでは一旦コンソールログのみ
    }
  };

  const handleClose = () => {
    setContent('');
    setError(null);
    onClose();
  };

  const isValid = content.trim().length > 0 && content.length <= MAX_LENGTH && !userLoading;
  const isOverLimit = content.length > MAX_LENGTH;
  const isSubmitting = createPost.isPending;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col animate-slide-up">
      {/* ヘッダー */}
      <header className="flex items-center justify-between px-4 h-12 border-b safe-area-top">
        <button
          onClick={handleClose}
          className="flex items-center gap-1 text-gray-600 hover:text-gray-900 btn-press"
        >
          <X size={24} />
          <span className="text-sm">キャンセル</span>
        </button>

        <button
          onClick={handleSubmit}
          disabled={!isValid || isSubmitting}
          className={`
            px-4 py-1.5 rounded-full text-sm font-bold
            transition-colors duration-200
            ${
              isValid && !isSubmitting
                ? 'bg-pink-500 text-white hover:bg-pink-600 active:bg-pink-700'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }
          `}
        >
          {isSubmitting ? '投稿中...' : '投稿する'}
        </button>
      </header>

      {/* コンテンツ */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          {/* ユーザー情報 */}
          <div className="flex items-center gap-3 mb-4">
            <Avatar className="h-10 w-10">
              <AvatarImage src={currentUser?.avatar_url || undefined} />
              <AvatarFallback>
                {currentUser?.nickname?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-bold">{currentUser?.nickname || 'ユーザー'}</p>
              <p className="text-sm text-gray-500">{getUserStatusLabel(currentUser?.status)}</p>
            </div>
          </div>

          {/* エラーメッセージ */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* テキストエリア */}
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="今どんな気持ち？相談したいことは？"
            className="
              w-full min-h-[200px] p-0
              text-lg leading-relaxed
              border-none outline-none resize-none
              placeholder:text-gray-400
              bg-transparent
            "
            maxLength={MAX_LENGTH + 100} // 超過表示のため余裕を持たせる
          />
        </div>
      </div>

      {/* フッター */}
      <footer className="border-t p-4 safe-area-bottom">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {userLoading
              ? '読み込み中...'
              : `ステータス「${getUserStatusLabel(currentUser?.status)}」で投稿されます`}
          </p>
          <p className={`text-sm font-medium ${isOverLimit ? 'text-red-500' : 'text-gray-400'}`}>
            {content.length} / {MAX_LENGTH}
          </p>
        </div>
      </footer>
    </div>
  );
}
