import axios, { AxiosError, AxiosInstance, AxiosResponse } from 'axios';

// Create axios instance with default configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: typeof window !== 'undefined' ? window.location.origin : '',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    const errorResponse = {
      message: 'An unexpected error occurred',
      status: error.response?.status || 500,
      data: error.response?.data || null,
    };

    if (error.response) {
      // Server responded with error status
      switch (error.response.status) {
        case 400:
          errorResponse.message = 'Bad request. Please check your input.';
          break;
        case 401:
          errorResponse.message = 'Unauthorized. Please sign in again.';
          break;
        case 403:
          errorResponse.message = 'Forbidden. You do not have permission.';
          break;
        case 404:
          errorResponse.message = 'Resource not found.';
          break;
        case 409:
          errorResponse.message = 'Conflict. Resource already exists.';
          break;
        case 500:
          errorResponse.message = 'Server error. Please try again later.';
          break;
        default:
          errorResponse.message = (error.response.data as any)?.message || 'An error occurred';
      }
    } else if (error.request) {
      // Request made but no response received
      errorResponse.message = 'Network error. Please check your connection.';
    }

    return Promise.reject(errorResponse);
  }
);

// API helper functions
export const api = {
  get: <T>(url: string, config?: any) =>
    apiClient.get<T>(url, config).then(res => res.data),

  post: <T>(url: string, data?: any, config?: any) =>
    apiClient.post<T>(url, data, config).then(res => res.data),

  put: <T>(url: string, data?: any, config?: any) =>
    apiClient.put<T>(url, data, config).then(res => res.data),

  delete: <T>(url: string, config?: any) =>
    apiClient.delete<T>(url, config).then(res => res.data),
};

export default apiClient;
