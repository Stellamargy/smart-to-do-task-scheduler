import { API_CONFIG, HTTP_METHODS, API_ERRORS, STATUS_CODES } from '@/config/api';

// Types
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
  status: number;
  success: boolean;
}

export interface ApiRequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
  token?: string;
}

class ApiService {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;

  constructor() {
    this.baseUrl = API_CONFIG.BASE_URL;
    this.defaultHeaders = API_CONFIG.HEADERS;
  }

  // Get auth token from localStorage
  public getAuthToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  // Set auth token
  public setAuthToken(token: string): void {
    localStorage.setItem('auth_token', token);
  }

  // Remove auth token
  public removeAuthToken(): void {
    localStorage.removeItem('auth_token');
  }

  // Build headers with auth token
  private buildHeaders(customHeaders?: Record<string, string>, token?: string): Record<string, string> {
    const headers = {
      ...this.defaultHeaders,
      ...customHeaders,
    };

    const authToken = token || this.getAuthToken();
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    return headers;
  }

  // Handle API errors
  private handleError(status: number, data: any): ApiResponse {
    let errorMessage = API_ERRORS.UNKNOWN_ERROR;

    switch (status) {
      case STATUS_CODES.BAD_REQUEST:
        errorMessage = data?.error || API_ERRORS.VALIDATION_ERROR;
        break;
      case STATUS_CODES.UNAUTHORIZED:
        errorMessage = API_ERRORS.UNAUTHORIZED;
        this.removeAuthToken(); // Clear invalid token
        break;
      case STATUS_CODES.FORBIDDEN:
        errorMessage = API_ERRORS.FORBIDDEN;
        break;
      case STATUS_CODES.NOT_FOUND:
        errorMessage = API_ERRORS.NOT_FOUND;
        break;
      case STATUS_CODES.CONFLICT:
        errorMessage = data?.error || API_ERRORS.VALIDATION_ERROR;
        break;
      case STATUS_CODES.SERVER_ERROR:
        errorMessage = API_ERRORS.SERVER_ERROR;
        break;
      default:
        errorMessage = data?.error || data?.message || API_ERRORS.UNKNOWN_ERROR;
    }

    return {
      error: errorMessage,
      status,
      success: false,
      data: data,
    };
  }

  // Main request method
  public async request<T = any>(
    endpoint: string,
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = HTTP_METHODS.GET,
      headers: customHeaders,
      body,
      token,
    } = options;

    const url = `${this.baseUrl}${endpoint}`;
    const headers = this.buildHeaders(customHeaders, token);

    const config: RequestInit = {
      method,
      headers,
    };

    // Add body for POST, PUT, PATCH requests
    if (body && [HTTP_METHODS.POST, HTTP_METHODS.PUT, HTTP_METHODS.PATCH].includes(method)) {
      config.body = typeof body === 'string' ? body : JSON.stringify(body);
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (response.ok) {
        return {
          data,
          status: response.status,
          success: true,
        };
      } else {
        return this.handleError(response.status, data);
      }
    } catch (error) {
      console.error('API Request Error:', error);
      return {
        error: API_ERRORS.NETWORK_ERROR,
        status: 0,
        success: false,
      };
    }
  }

  // Convenience methods
  public async get<T = any>(endpoint: string, options?: Omit<ApiRequestOptions, 'method'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: HTTP_METHODS.GET });
  }

  public async post<T = any>(endpoint: string, body?: any, options?: Omit<ApiRequestOptions, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: HTTP_METHODS.POST, body });
  }

  public async put<T = any>(endpoint: string, body?: any, options?: Omit<ApiRequestOptions, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: HTTP_METHODS.PUT, body });
  }

  public async patch<T = any>(endpoint: string, body?: any, options?: Omit<ApiRequestOptions, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: HTTP_METHODS.PATCH, body });
  }

  public async delete<T = any>(endpoint: string, options?: Omit<ApiRequestOptions, 'method'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: HTTP_METHODS.DELETE });
  }
}

// Create singleton instance
export const apiService = new ApiService();
export default apiService;
