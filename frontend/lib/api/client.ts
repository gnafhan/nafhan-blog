import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

// Custom error class for API errors
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public error: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// API client class
class ApiClient {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        if (this.token && config.headers) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response) {
          const { status, data } = error.response;
          const errorData = data as { message?: string | string[]; error?: string };
          
          throw new ApiError(
            status,
            Array.isArray(errorData.message) 
              ? errorData.message.join(', ') 
              : errorData.message || 'An error occurred',
            errorData.error || 'Error'
          );
        }
        
        // Network error or no response
        throw new ApiError(
          0,
          'Network error. Please check your connection.',
          'NetworkError'
        );
      }
    );
  }

  // Set authentication token
  setAuthToken(token: string): void {
    this.token = token;
  }

  // Clear authentication token
  clearAuthToken(): void {
    this.token = null;
  }

  // GET request
  async get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
    const response = await this.client.get<T>(url, { params });
    return response.data;
  }

  // POST request
  async post<T>(url: string, data?: unknown): Promise<T> {
    const response = await this.client.post<T>(url, data);
    return response.data;
  }

  // PUT request
  async put<T>(url: string, data?: unknown): Promise<T> {
    const response = await this.client.put<T>(url, data);
    return response.data;
  }

  // DELETE request
  async delete(url: string): Promise<void> {
    await this.client.delete(url);
  }

  // POST request with FormData (for file uploads)
  async postFormData<T>(url: string, formData: FormData): Promise<T> {
    const response = await this.client.post<T>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // PUT request with FormData (for file uploads)
  async putFormData<T>(url: string, formData: FormData): Promise<T> {
    const response = await this.client.put<T>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
