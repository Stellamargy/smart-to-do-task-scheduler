import { useState, useEffect, useContext, createContext, ReactNode } from 'react';
import { authService, User, LoginRequest, RegisterRequest } from '@/services/auth';
import { ApiResponse } from '@/services/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<ApiResponse>;
  register: (userData: RegisterRequest) => Promise<ApiResponse>;
  logout: () => void;
  updateProfile: (data: { email?: string }) => Promise<ApiResponse>;
  changePassword: (data: { current_password: string; new_password: string }) => Promise<ApiResponse>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize auth state on app start
    const initializeAuth = async () => {
      try {
        if (authService.isAuthenticated()) {
          const response = await authService.getProfile();
          if (response.success && response.data) {
            setUser(response.data.user);
          } else {
            authService.logout();
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        authService.logout();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (credentials: LoginRequest): Promise<ApiResponse> => {
    setIsLoading(true);
    try {
      const response = await authService.login(credentials);
      if (response.success && response.data) {
        setUser(response.data.user);
      }
      return response;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterRequest): Promise<ApiResponse> => {
    setIsLoading(true);
    try {
      const response = await authService.register(userData);
      if (response.success && response.data) {
        setUser(response.data.user);
      }
      return response;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const updateProfile = async (data: { email?: string }): Promise<ApiResponse> => {
    const response = await authService.updateProfile(data);
    if (response.success && response.data) {
      setUser(response.data.user);
    }
    return response;
  };

  const changePassword = async (data: { current_password: string; new_password: string }): Promise<ApiResponse> => {
    return await authService.changePassword(data);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
