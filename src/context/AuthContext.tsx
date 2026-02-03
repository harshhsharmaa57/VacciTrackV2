import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI } from '@/lib/api';

export interface User {
  _id?: string;
  id?: string;
  email: string;
  name: string;
  role: 'parent' | 'doctor';
  phone?: string;
  hospitalName?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored session and validate token
    const checkAuth = async () => {
      const token = localStorage.getItem('vaccitrack_token');
      if (token) {
        try {
          const response = await authAPI.getCurrentUser();
          if (response.success && response.data) {
            // Normalize user object (handle both _id and id)
            const userData = {
              ...response.data,
              id: response.data._id || response.data.id,
            };
            setUser(userData);
            localStorage.setItem('vaccitrack_user_id', userData.id || userData._id || '');
          } else {
            // Token invalid, clear storage
            authAPI.logout();
          }
        } catch (error) {
          // Token invalid or expired
          authAPI.logout();
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await authAPI.login(email, password);
      if (response.success && response.data) {
        // Normalize user object
        const userData = {
          ...response.data.user,
          id: response.data.user._id || response.data.user.id,
        };
        setUser(userData);
        localStorage.setItem('vaccitrack_user_id', userData.id || userData._id || '');
        return { success: true };
      }
      return { success: false, error: response.error || 'Login failed' };
    } catch (error: any) {
      return { success: false, error: error.message || 'Invalid email or password' };
    }
  };

  const logout = () => {
    authAPI.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
