import { apiClient } from './client';

// Types
export interface UploadImageResponse {
  url: string;
}

// Images API service
export const imagesApi = {
  // Upload content image for rich text editor
  uploadContentImage: async (file: File): Promise<UploadImageResponse> => {
    const formData = new FormData();
    formData.append('image', file);  // Field name must match backend's FileInterceptor('image')
    return apiClient.postFormData<UploadImageResponse>('/images/upload', formData);
  },
};
