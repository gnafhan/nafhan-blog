import { apiClient } from './client';

// Types
export interface Post {
  _id: string;
  title: string;
  slug: string;
  content: string;
  description: string;
  category?: string;
  thumbnail?: string;
  claps?: number;
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
  thumbnail?: File;
}

export interface UpdatePostData {
  title?: string;
  content?: string;
  description?: string;
  category?: string;
  thumbnail?: File;
}

export interface QueryParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  author?: string;
  [key: string]: unknown;
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

// Helper function to convert post data to FormData
const toFormData = (data: CreatePostData | UpdatePostData): FormData => {
  const formData = new FormData();
  
  if ('title' in data && data.title !== undefined) {
    formData.append('title', data.title);
  }
  if ('content' in data && data.content !== undefined) {
    formData.append('content', data.content);
  }
  if (data.description !== undefined) {
    formData.append('description', data.description);
  }
  if (data.category !== undefined) {
    formData.append('category', data.category);
  }
  if (data.thumbnail !== undefined) {
    formData.append('thumbnail', data.thumbnail);
  }
  
  return formData;
};

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

  // Get single post by slug
  getBySlug: async (slug: string): Promise<Post> => {
    return apiClient.get<Post>(`/posts/by-slug/${slug}`);
  },

  // Create new post (uses FormData for thumbnail support)
  create: async (data: CreatePostData): Promise<Post> => {
    const formData = toFormData(data);
    return apiClient.postFormData<Post>('/posts', formData);
  },

  // Update post (uses FormData for thumbnail support)
  update: async (id: string, data: UpdatePostData): Promise<Post> => {
    const formData = toFormData(data);
    return apiClient.putFormData<Post>(`/posts/${id}`, formData);
  },

  // Delete post
  delete: async (id: string): Promise<void> => {
    return apiClient.delete(`/posts/${id}`);
  },

  // Add clap to post
  clap: async (id: string): Promise<{ claps: number }> => {
    return apiClient.post<{ claps: number }>(`/posts/${id}/clap`, {});
  },
};
