import { Reply } from '@/types';

/**
 * Find a reply recursively in a nested reply tree
 */
export function findReplyRecursively(replies: Reply[], replyId: string): Reply | null {
  for (const reply of replies) {
    if (reply.id === replyId) {
      return reply;
    }
    if (reply.replies && reply.replies.length > 0) {
      const found = findReplyRecursively(reply.replies, replyId);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Add a reply recursively to the correct parent in the tree
 */
export function addReplyRecursively(replies: Reply[], parentId: string, newReply: Reply): Reply[] {
  return replies.map((reply) => {
    if (reply.id === parentId) {
      return {
        ...reply,
        replies: [...(reply.replies || []), newReply],
        replies_count: (reply.replies_count || 0) + 1,
        has_replies: true,
      };
    }
    if (reply.replies && reply.replies.length > 0) {
      return {
        ...reply,
        replies: addReplyRecursively(reply.replies, parentId, newReply),
      };
    }
    return reply;
  });
}

/**
 * Replace a reply recursively in the tree
 */
export function replaceReplyRecursively(replies: Reply[], oldId: string, newReply: Reply): Reply[] {
  return replies.map((reply) => {
    if (reply.id === oldId) {
      return { ...newReply, replies: reply.replies };
    }
    if (reply.replies && reply.replies.length > 0) {
      return {
        ...reply,
        replies: replaceReplyRecursively(reply.replies, oldId, newReply),
      };
    }
    return reply;
  });
}

/**
 * Remove a reply recursively from the tree
 */
export function removeReplyRecursively(
  replies: Reply[],
  parentId: string | null,
  replyIdToRemove: string
): Reply[] {
  if (!parentId) {
    // Remove from top level
    return replies.filter((r) => r.id !== replyIdToRemove);
  }

  return replies.map((reply) => {
    if (reply.id === parentId) {
      return {
        ...reply,
        replies: (reply.replies || []).filter((r) => r.id !== replyIdToRemove),
        replies_count: Math.max(0, (reply.replies_count || 0) - 1),
        has_replies: (reply.replies_count || 0) > 1,
      };
    }
    if (reply.replies && reply.replies.length > 0) {
      return {
        ...reply,
        replies: removeReplyRecursively(reply.replies, parentId, replyIdToRemove),
      };
    }
    return reply;
  });
}

/**
 * Find the path to a reply in the tree
 */
export function findReplyPath(
  replies: Reply[],
  targetId: string,
  path: string[] = []
): string[] | null {
  for (const reply of replies) {
    if (reply.id === targetId) {
      return path;
    }
    if (reply.replies && reply.replies.length > 0) {
      const foundPath = findReplyPath(reply.replies, targetId, [...path, reply.id]);
      if (foundPath) {
        return foundPath;
      }
    }
  }
  return null;
}

/**
 * Flatten nested replies into a single array
 */
export function flattenReplies(replies: Reply[]): Reply[] {
  const result: Reply[] = [];

  function traverse(replyList: Reply[]) {
    for (const reply of replyList) {
      result.push(reply);
      if (reply.replies && reply.replies.length > 0) {
        traverse(reply.replies);
      }
    }
  }

  traverse(replies);
  return result;
}

/**
 * Build nested reply tree from flat array
 */
export function buildNestedReplies(flatReplies: Reply[]): Reply[] {
  const replyMap = new Map<string, Reply>();
  const topLevelReplies: Reply[] = [];

  // Initialize all replies in the map
  flatReplies.forEach((reply) => {
    replyMap.set(reply.id, { ...reply, replies: [] });
  });

  // Build parent-child relationships
  flatReplies.forEach((reply) => {
    const replyWithChildren = replyMap.get(reply.id)!;
    if (reply.parent_id) {
      const parent = replyMap.get(reply.parent_id);
      if (parent) {
        parent.replies = parent.replies || [];
        parent.replies.push(replyWithChildren);
      } else {
        // Parent not found, treat as top-level
        topLevelReplies.push(replyWithChildren);
      }
    } else {
      topLevelReplies.push(replyWithChildren);
    }
  });

  return topLevelReplies;
}
