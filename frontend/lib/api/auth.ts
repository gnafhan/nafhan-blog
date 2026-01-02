import { apiClient } from './client';

// Types
export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  profilePicture?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Auth API service
export const authApi = {
  // Register new user
  register: async (data: RegisterData): Promise<AuthResponse> => {
    return apiClient.post<AuthResponse>('/auth/register', data);
  },

  // Login user
  login: async (data: LoginData): Promise<AuthResponse> => {
    return apiClient.post<AuthResponse>('/auth/login', data);
  },

  // Logout user
  logout: async (): Promise<void> => {
    return apiClient.post<void>('/auth/logout');
  },

  // Get current user profile
  getProfile: async (): Promise<User> => {
    return apiClient.get<User>('/auth/profile');
  },
};
