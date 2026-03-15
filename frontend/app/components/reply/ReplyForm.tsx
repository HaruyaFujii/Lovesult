'use client';

import { useState } from 'react';
import { useCurrentUser } from '@/hooks/use-user';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ReplyFormProps {
  onSubmit: (content: string) => Promise<void>;
  placeholder?: string;
}

export default function ReplyForm({ onSubmit, placeholder = '返信する' }: ReplyFormProps) {
  const { data: currentUser } = useCurrentUser();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim() || loading) {
      return;
    }

    setLoading(true);

    try {
      await onSubmit(content.trim());
      setContent('');
    } catch (err: any) {
      // エラーハンドリングはサイレント
    } finally {
      setLoading(false);
    }
  };

  const isValid = content.trim().length > 0 && content.length <= 300;

  if (!currentUser) {
    return <div className="bg-white p-4 text-center text-gray-500">ログインが必要です</div>;
  }

  return (
    <div className="bg-white">
      <div className="flex gap-3 p-4">
        {/* 縦線なし（固定フォームなので） */}
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={currentUser?.avatar_url || undefined} />
          <AvatarFallback className="text-xs">
            {currentUser?.nickname?.charAt(0) || 'U'}
          </AvatarFallback>
        </Avatar>

        {/* 入力フォーム */}
        <form onSubmit={handleSubmit} className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={placeholder}
            className="w-full text-base placeholder:text-gray-500 border border-gray-200 rounded-lg px-3 py-2 outline-none resize-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
            rows={2}
            maxLength={300}
          />

          <div className="flex items-center justify-between mt-3">
            <span className={`text-sm ${content.length > 280 ? 'text-red-500' : 'text-gray-500'}`}>
              {content.length > 0 && `${content.length}/300`}
            </span>
            <button
              type="submit"
              disabled={loading || !isValid}
              className={`px-4 py-1.5 font-semibold rounded-full text-sm transition-colors min-w-[60px] ${
                loading || !isValid
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-pink-600 text-white hover:bg-pink-700'
              }`}
              style={{ display: 'block' }} // Force display
            >
              {loading ? '送信中...' : '返信'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
