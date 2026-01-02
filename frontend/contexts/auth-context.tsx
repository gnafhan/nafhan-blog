'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient } from '@/lib/api/client';

// User type
export interface User {
  id: string;
  name: string;
  email: string;
  profilePicture?: string;
}

// Auth context type
interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: User | { _id: string; name: string; email: string; profilePicture?: string }) => void;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Storage keys
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

// Auth provider props
interface AuthProviderProps {
  children: ReactNode;
}

// Auth provider component
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = () => {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      const storedUser = localStorage.getItem(USER_KEY);

      if (storedToken && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          
          // Normalize user data - ensure we have 'id' field
          // Handle both old format (_id) and new format (id)
          const normalizedUser: User = {
            id: parsedUser.id || parsedUser._id,
            name: parsedUser.name,
            email: parsedUser.email,
            profilePicture: parsedUser.profilePicture,
          };
          
          setToken(storedToken);
          setUser(normalizedUser);
          apiClient.setAuthToken(storedToken);
          
          // Update localStorage with normalized format if needed
          if (!parsedUser.id && parsedUser._id) {
            localStorage.setItem(USER_KEY, JSON.stringify(normalizedUser));
          }
        } catch {
          // Invalid stored data, clear it
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
        }
      }

      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  // Login function
  const login = async (email: string, password: string): Promise<void> => {
    try {
      const response = await apiClient.post<{ user: { _id: string; name: string; email: string; profilePicture?: string }; token: string }>(
        '/auth/login',
        { email, password }
      );

      const { user: userData, token: authToken } = response;
      
      // Normalize user data (backend returns _id, frontend uses id)
      const normalizedUser: User = {
        id: userData._id,
        name: userData.name,
        email: userData.email,
        profilePicture: userData.profilePicture,
      };

      // Store in state
      setUser(normalizedUser);
      setToken(authToken);

      // Store in localStorage
      localStorage.setItem(TOKEN_KEY, authToken);
      localStorage.setItem(USER_KEY, JSON.stringify(normalizedUser));

      // Set token in API client
      apiClient.setAuthToken(authToken);
    } catch (error) {
      throw error;
    }
  };

  // Register function
  const register = async (
    name: string,
    email: string,
    password: string
  ): Promise<void> => {
    try {
      const response = await apiClient.post<{ user: { _id: string; name: string; email: string; profilePicture?: string }; token: string }>(
        '/auth/register',
        { name, email, password }
      );

      const { user: userData, token: authToken } = response;
      
      // Normalize user data (backend returns _id, frontend uses id)
      const normalizedUser: User = {
        id: userData._id,
        name: userData.name,
        email: userData.email,
        profilePicture: userData.profilePicture,
      };

      // Store in state
      setUser(normalizedUser);
      setToken(authToken);

      // Store in localStorage
      localStorage.setItem(TOKEN_KEY, authToken);
      localStorage.setItem(USER_KEY, JSON.stringify(normalizedUser));

      // Set token in API client
      apiClient.setAuthToken(authToken);
    } catch (error) {
      throw error;
    }
  };

  // Logout function
  const logout = (): void => {
    // Clear state
    setUser(null);
    setToken(null);

    // Clear localStorage
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);

    // Clear token from API client
    apiClient.clearAuthToken();
  };

  // Update user function (for profile updates)
  const updateUser = (updatedUser: User | { _id: string; name: string; email: string; profilePicture?: string }): void => {
    // Normalize user data if it has _id instead of id
    const normalizedUser: User = 'id' in updatedUser 
      ? updatedUser as User
      : {
          id: (updatedUser as { _id: string })._id,
          name: updatedUser.name,
          email: updatedUser.email,
          profilePicture: updatedUser.profilePicture,
        };
    
    setUser(normalizedUser);
    localStorage.setItem(USER_KEY, JSON.stringify(normalizedUser));
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!user && !!token,
    login,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}
