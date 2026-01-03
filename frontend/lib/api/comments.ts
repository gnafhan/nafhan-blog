import { apiClient } from './client';

// Types
export interface Comment {
  _id: string;
  content: string;
  post: string;
  author: {
    _id: string;
    name: string;
    email: string;
    profilePicture?: string;
  };
  parentComment?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommentWithReplies extends Comment {
  replies: CommentWithReplies[];
}

export interface CreateCommentData {
  content: string;
  parentCommentId?: string;
}

export interface UpdateCommentData {
  content: string;
}

// Comments API service
export const commentsApi = {
  // Get all comments for a post (returns nested structure)
  getByPost: async (postId: string): Promise<CommentWithReplies[]> => {
    return apiClient.get<CommentWithReplies[]>(`/posts/${postId}/comments`);
  },

  // Create new comment (optionally as a reply to another comment)
  create: async (postId: string, data: CreateCommentData): Promise<Comment> => {
    return apiClient.post<Comment>(`/posts/${postId}/comments`, data);
  },

  // Update comment
  update: async (id: string, data: UpdateCommentData): Promise<Comment> => {
    return apiClient.put<Comment>(`/comments/${id}`, data);
  },

  // Delete comment (cascades to all replies)
  delete: async (id: string): Promise<void> => {
    return apiClient.delete(`/comments/${id}`);
  },
};
