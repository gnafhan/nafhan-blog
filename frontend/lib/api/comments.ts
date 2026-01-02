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
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommentData {
  content: string;
}

export interface UpdateCommentData {
  content: string;
}

// Comments API service
export const commentsApi = {
  // Get all comments for a post
  getByPost: async (postId: string): Promise<Comment[]> => {
    return apiClient.get<Comment[]>(`/posts/${postId}/comments`);
  },

  // Create new comment
  create: async (postId: string, data: CreateCommentData): Promise<Comment> => {
    return apiClient.post<Comment>(`/posts/${postId}/comments`, data);
  },

  // Update comment
  update: async (id: string, data: UpdateCommentData): Promise<Comment> => {
    return apiClient.put<Comment>(`/comments/${id}`, data);
  },

  // Delete comment
  delete: async (id: string): Promise<void> => {
    return apiClient.delete(`/comments/${id}`);
  },
};
