import { apiService, ApiResponse } from './api';
import { API_CONFIG } from '@/config/api';

// Types
export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  bio: string;
  created_at: string;
  is_active: boolean;
}

export interface LoginRequest {
  login: string;  // Can be username or email
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
  message: string;
  generated_username?: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

export interface UpdateProfileRequest {
  name?: string;
  email?: string;
  bio?: string;
}

class AuthService {
  private currentUser: User | null = null;

  // Register new user
  public async register(data: RegisterRequest): Promise<ApiResponse<AuthResponse>> {
    const response = await apiService.post<AuthResponse>(API_CONFIG.ENDPOINTS.AUTH.REGISTER, data);
    
    if (response.success && response.data) {
      this.handleAuthSuccess(response.data);
    }
    
    return response;
  }

  // Login user
  public async login(data: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    const response = await apiService.post<AuthResponse>(API_CONFIG.ENDPOINTS.AUTH.LOGIN, data);
    
    if (response.success && response.data) {
      this.handleAuthSuccess(response.data);
    }
    
    return response;
  }

  // Get current user profile
  public async getProfile(): Promise<ApiResponse<{ user: User }>> {
    const response = await apiService.get<{ user: User }>(API_CONFIG.ENDPOINTS.AUTH.PROFILE);
    
    if (response.success && response.data) {
      this.currentUser = response.data.user;
      localStorage.setItem('current_user', JSON.stringify(response.data.user));
    }
    
    return response;
  }

  // Update user profile
  public async updateProfile(data: UpdateProfileRequest): Promise<ApiResponse<{ user: User; message: string }>> {
    const response = await apiService.put<{ user: User; message: string }>(
      API_CONFIG.ENDPOINTS.AUTH.PROFILE,
      data
    );
    
    if (response.success && response.data) {
      this.currentUser = response.data.user;
      localStorage.setItem('current_user', JSON.stringify(response.data.user));
    }
    
    return response;
  }

  // Change password
  public async changePassword(data: ChangePasswordRequest): Promise<ApiResponse<{ message: string }>> {
    return await apiService.post<{ message: string }>(
      API_CONFIG.ENDPOINTS.AUTH.CHANGE_PASSWORD,
      data
    );
  }

  // Logout user
  public logout(): void {
    apiService.removeAuthToken();
    this.currentUser = null;
    localStorage.removeItem('current_user');
  }

  // Check if user is authenticated
  public isAuthenticated(): boolean {
    return !!apiService.getAuthToken();
  }

  // Get current user
  public getCurrentUser(): User | null {
    if (!this.currentUser) {
      const storedUser = localStorage.getItem('current_user');
      if (storedUser) {
        try {
          this.currentUser = JSON.parse(storedUser);
        } catch (error) {
          console.error('Error parsing stored user:', error);
          localStorage.removeItem('current_user');
        }
      }
    }
    return this.currentUser;
  }

  // Handle successful authentication
  private handleAuthSuccess(authData: AuthResponse): void {
    apiService.setAuthToken(authData.access_token);
    this.currentUser = authData.user;
    localStorage.setItem('current_user', JSON.stringify(authData.user));
  }

  // Initialize auth state (call on app startup)
  public async initializeAuth(): Promise<void> {
    if (this.isAuthenticated()) {
      try {
        await this.getProfile();
      } catch (error) {
        console.error('Failed to initialize auth state:', error);
        this.logout();
      }
    }
  }

  // Validate token and refresh user data
  public async validateSession(): Promise<boolean> {
    if (!this.isAuthenticated()) {
      return false;
    }

    try {
      const response = await this.getProfile();
      return response.success;
    } catch (error) {
      console.error('Session validation failed:', error);
      this.logout();
      return false;
    }
  }
}

// Create singleton instance
export const authService = new AuthService();
export default authService;
