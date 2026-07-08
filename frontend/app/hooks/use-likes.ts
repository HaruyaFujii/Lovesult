import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  likePost as likePostApi,
  unlikePost as unlikePostApi,
  likeReply as likeReplyApi,
  unlikeReply as unlikeReplyApi,
} from '@/lib/api/generated/endpoints/likes/likes';

/**
 * いいね関連は投稿およびリプライのカウント/フラグに反映されるので
 * `['posts']` `['post', id]` `['replies']` `['reply', id]` を無効化する。
 */

export const useLikePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId }: { postId: string }) => {
      const response = await likePostApi(postId);
      return response.data;
    },
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });
};

export const useUnlikePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId }: { postId: string }) => {
      const response = await unlikePostApi(postId);
      return response.data;
    },
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
    },
  });
};

export const useLikeReply = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ replyId }: { replyId: string }) => {
      const response = await likeReplyApi(replyId);
      return response.data;
    },
    onSuccess: (_, { replyId }) => {
      // リプライは posts テーブル上でカウントが管理されるので posts / replies 両方無効化
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['replies'] });
      queryClient.invalidateQueries({ queryKey: ['reply', replyId] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });
};

export const useUnlikeReply = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ replyId }: { replyId: string }) => {
      const response = await unlikeReplyApi(replyId);
      return response.data;
    },
    onSuccess: (_, { replyId }) => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['replies'] });
      queryClient.invalidateQueries({ queryKey: ['reply', replyId] });
    },
  });
};
