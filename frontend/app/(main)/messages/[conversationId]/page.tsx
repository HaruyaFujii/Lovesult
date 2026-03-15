'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useConversation, useMessages, useSendMessage, useMarkAsRead } from '@/hooks/use-dm';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Send, Clock, AlertCircle } from 'lucide-react';
import { formatDistanceToNowJST } from '@/lib/utils/date';
import { MobileHeader } from '@/components/layout/MobileHeader';
import { useSwipeBack } from '@/hooks/useSwipeBack';

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.conversationId as string;

  const [messageContent, setMessageContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // スワイプで戻る機能を有効化
  useSwipeBack();

  const { data: conversation, isLoading: conversationLoading } = useConversation(conversationId);
  const { data: messagesData, isLoading: messagesLoading } = useMessages(conversationId);
  const { mutate: sendMessage, isPending: isSending } = useSendMessage(conversationId);
  const { mutate: markAsRead } = useMarkAsRead(conversationId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messagesData]);

  useEffect(() => {
    // ページ訪問時に既読にする
    if (conversationId) {
      markAsRead();
    }
  }, [conversationId, markAsRead]);

  // テキストエリアの高さを自動調整
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [messageContent]);

  const handleSend = (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();

    if (!messageContent.trim() || isSending) return;

    const messageToSend = messageContent.trim();

    // 即座に入力欄をクリア
    setMessageContent('');

    sendMessage(messageToSend);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Enter（Shift なし）で送信
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (conversationLoading || messagesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  const messages = messagesData?.messages || [];

  return (
    <div className="flex flex-col h-screen">
      {/* モバイルヘッダー */}
      <MobileHeader />

      {/* メッセージエリア */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 hide-scrollbar">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <p>メッセージはまだありません</p>
            <p className="text-sm mt-2">最初のメッセージを送信してみましょう</p>
          </div>
        ) : (
          <>
            {messages.slice().reverse().map((message) => (
              <div
                key={message.id}
                className={`flex ${message.is_mine ? 'justify-end' : 'justify-start'}`}
              >
                <div className="max-w-[70%]">
                  <div
                    className={`${
                      message.is_mine
                        ? `${message.status === 'error' ? 'bg-red-500' : 'bg-pink-500'} text-white rounded-l-lg rounded-tr-lg`
                        : 'bg-gray-100 text-gray-900 rounded-r-lg rounded-tl-lg'
                    } px-4 py-2`}
                  >
                    <p className="text-sm break-words">{message.content}</p>
                    <p
                      className={`text-xs mt-1 ${
                        message.is_mine ? 'text-pink-100' : 'text-gray-500'
                      }`}
                    >
                      {formatDistanceToNowJST(message.created_at)}
                    </p>
                  </div>

                  {/* ステータス表示（メッセージの下） */}
                  {message.is_mine && message.status && (
                    <div className={`flex items-center gap-1 mt-1 text-xs ${
                      message.is_mine ? 'justify-end' : 'justify-start'
                    }`}>
                      {message.status === 'sending' && (
                        <>
                          <Clock className="h-3 w-3 text-gray-400" />
                          <span className="text-gray-400">送信中...</span>
                        </>
                      )}
                      {message.status === 'sent' && (
                        <span className="text-gray-400">送信完了</span>
                      )}
                      {message.status === 'error' && (
                        <>
                          <AlertCircle className="h-3 w-3 text-red-500" />
                          <span className="text-red-500">送信失敗</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* 入力エリア */}
      <div className="border-t bg-white p-2 safe-area-bottom">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={messageContent}
            onChange={(e) => setMessageContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="メッセージを入力..."
            rows={1}
            className="
              flex-1 px-4 py-2
              bg-gray-100 rounded-full
              border-none outline-none resize-none
              text-sm leading-relaxed
              max-h-[120px]
            "
            disabled={isSending}
            maxLength={1000}
          />
          <button
            onClick={() => handleSend()}
            disabled={!messageContent.trim() || isSending}
            className={`
              w-10 h-10 rounded-full
              flex items-center justify-center
              transition-colors duration-200
              btn-press
              ${
                messageContent.trim() && !isSending
                  ? 'bg-pink-500 text-white'
                  : 'bg-gray-200 text-gray-400'
              }
            `}
          >
            {isSending ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Send size={18} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}