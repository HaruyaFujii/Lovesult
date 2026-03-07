import { Reply } from '@/types';

interface ReplyCardProps {
  reply: Reply;
  showActions?: boolean;
  onDelete?: () => void;
}

export default function ReplyCard({ reply, showActions = false, onDelete }: ReplyCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return 'たった今';
    if (minutes < 60) return `${minutes}分前`;
    if (hours < 24) return `${hours}時間前`;
    if (days < 7) return `${days}日前`;
    return date.toLocaleDateString('ja-JP');
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="flex items-start space-x-3">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-gray-900">
              {reply.user?.nickname || 'Unknown'}
            </span>
            <span className="text-sm text-gray-500">{formatDate(reply.created_at)}</span>
          </div>

          <p className="text-gray-800 whitespace-pre-wrap break-words">
            {reply.content}
          </p>

          {showActions && (
            <div className="mt-2">
              <button
                onClick={onDelete}
                className="text-sm text-gray-600 hover:text-red-600"
              >
                削除
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}