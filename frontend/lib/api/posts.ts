import { apiClient } from './client';

// Types
export interface Post {
  _id: string;
  title: string;
  content: string;
  description: string;
  category?: string;
  author: {
    _id: string;
    name: string;
    email: string;
    profilePicture?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreatePostData {
  title: string;
  content: string;
  description?: string;
  category?: string;
}

export interface UpdatePostData {
  title?: string;
  content?: string;
  description?: string;
  category?: string;
}

export interface QueryParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface PaginatedPosts {
  data: Post[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Posts API service
export const postsApi = {
  // Get all posts with pagination and search
  getAll: async (params?: QueryParams): Promise<PaginatedPosts> => {
    return apiClient.get<PaginatedPosts>('/posts', params);
  },

  // Get single post by ID
  getById: async (id: string): Promise<Post> => {
    return apiClient.get<Post>(`/posts/${id}`);
  },

  // Create new post
  create: async (data: CreatePostData): Promise<Post> => {
    return apiClient.post<Post>('/posts', data);
  },

  // Update post
  update: async (id: string, data: UpdatePostData): Promise<Post> => {
    return apiClient.put<Post>(`/posts/${id}`, data);
  },

  // Delete post
  delete: async (id: string): Promise<void> => {
    return apiClient.delete(`/posts/${id}`);
  },
};
