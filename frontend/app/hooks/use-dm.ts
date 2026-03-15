import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customInstance } from '@/lib/api/customInstance';
import { nowJST } from '@/lib/utils/date';

export interface UserBrief {
  id: string;
  nickname: string;
  avatar_url?: string | null;
}

export interface MessageResponse {
  id: string;
  sender_id: string;
  sender?: UserBrief | null;
  content: string;
  created_at: string;
  is_mine: boolean;
  // オプティミスティック更新用の状態
  status?: 'sending' | 'sent' | 'error';
}

export interface ConversationResponse {
  id: string;
  partner?: UserBrief | null;
  last_message?: MessageResponse | null;
  unread_count: number;
  updated_at: string;
}

export interface ConversationDetailResponse {
  id: string;
  partner?: UserBrief | null;
  created_at: string;
}

export interface ConversationListResponse {
  conversations: ConversationResponse[];
  cursor?: string | null;
}

export interface MessageListResponse {
  messages: MessageResponse[];
  cursor?: string | null;
}

export function useConversations(cursor?: string, limit: number = 20) {
  return useQuery({
    queryKey: ['conversations', cursor, limit],
    queryFn: async (): Promise<ConversationListResponse> => {
      const params: any = { limit };
      if (cursor) params.cursor = cursor;

      const response = await customInstance<{ data: ConversationListResponse }>(
        '/api/v1/conversations',
        {
          params,
        }
      );
      return response.data;
    },
  });
}

export function useConversation(conversationId: string) {
  return useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: async (): Promise<ConversationDetailResponse> => {
      const response = await customInstance<{ data: ConversationDetailResponse }>(
        `/api/v1/conversations/${conversationId}`
      );
      return response.data;
    },
    enabled: !!conversationId,
  });
}

export function useMessages(conversationId: string, cursor?: string, limit: number = 50) {
  return useQuery({
    queryKey: ['messages', conversationId, cursor, limit],
    queryFn: async (): Promise<MessageListResponse> => {
      const params: any = { limit };
      if (cursor) params.cursor = cursor;

      const response = await customInstance<{ data: MessageListResponse }>(
        `/api/v1/conversations/${conversationId}/messages`,
        { params }
      );
      return response.data;
    },
    enabled: !!conversationId,
  });
}

export function useSendMessage(conversationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (content: string) => {
      const response = await customInstance<{ data: MessageResponse }>(
        `/api/v1/conversations/${conversationId}/messages`,
        {
          method: 'POST',
          data: { content },
        }
      );
      return response.data;
    },
    // オプティミスティック更新: 送信前にUIを即座に更新
    onMutate: async (content: string) => {
      // 進行中のクエリをキャンセル（正確なクエリキーでキャンセル）
      await queryClient.cancelQueries({
        queryKey: ['messages', conversationId],
        exact: false, // cursorやlimitが含まれるクエリもキャンセル
      });

      // 現在のデータを取得してバックアップ（実際に使用されているキーから取得）
      const messagesQueryState = queryClient.getQueriesData<MessageListResponse>({
        queryKey: ['messages', conversationId],
      });
      const previousMessages = messagesQueryState.length > 0 ? messagesQueryState[0][1] : undefined;

      // 一時的なメッセージオブジェクトを作成
      const tempMessage: MessageResponse = {
        id: `temp-${Date.now()}`, // 一時的なID
        sender_id: 'current-user', // 実際のユーザーIDは不明だが送信者は自分
        content,
        created_at: nowJST().toISOString(),
        is_mine: true,
        status: 'sending', // 送信中状態
      };

      // UIを即座に更新（全ての該当するクエリを更新）
      queryClient.setQueriesData<MessageListResponse>(
        { queryKey: ['messages', conversationId], exact: false },
        (old) => {
          if (!old) return { messages: [tempMessage], cursor: null };
          return {
            ...old,
            messages: [tempMessage, ...old.messages],
          };
        }
      );

      // エラー時に復元するためのデータを返す
      return { previousMessages };
    },
    onSuccess: (serverMessage, content, context) => {
      // サーバーレスポンスで一時メッセージを置き換え（全ての該当するクエリを更新）
      queryClient.setQueriesData<MessageListResponse>(
        { queryKey: ['messages', conversationId], exact: false },
        (old) => {
          if (!old) return { messages: [{ ...serverMessage, status: 'sent' }], cursor: null };

          // 一時メッセージを除去してサーバーメッセージを追加
          const filteredMessages = old.messages.filter((msg) => !msg.id.startsWith('temp-'));
          return {
            ...old,
            messages: [{ ...serverMessage, status: 'sent' }, ...filteredMessages],
          };
        }
      );

      // 2秒後にsentステータスを除去
      setTimeout(() => {
        queryClient.setQueriesData<MessageListResponse>(
          { queryKey: ['messages', conversationId], exact: false },
          (old) => {
            if (!old) return old;
            return {
              ...old,
              messages: old.messages.map((msg) =>
                msg.id === serverMessage.id ? { ...msg, status: undefined } : msg
              ),
            };
          }
        );
      }, 2000);

      // 会話一覧も更新
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (error, content, context) => {
      // エラー時は一時メッセージをエラー状態にマーク（全ての該当するクエリを更新）
      queryClient.setQueriesData<MessageListResponse>(
        { queryKey: ['messages', conversationId], exact: false },
        (old) => {
          if (!old) return old;

          return {
            ...old,
            messages: old.messages.map((msg) =>
              msg.id.startsWith('temp-') && msg.content === content
                ? { ...msg, status: 'error' as const }
                : msg
            ),
          };
        }
      );
    },
  });
}

export function useCreateConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (partnerId: string) => {
      const response = await customInstance<{ data: ConversationDetailResponse }>(
        '/api/v1/conversations',
        {
          method: 'POST',
          data: { partner_id: partnerId },
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useMarkAsRead(conversationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await customInstance(`/api/v1/conversations/${conversationId}/read`, {
        method: 'PUT',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}
