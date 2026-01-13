import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { StorageService } from '../services/storage';
import { supabase } from '../lib/supabase';
import type { User, LoginRequest, RegisterRequest } from '../types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // 먼저 StorageService에서 확인
      const token = await StorageService.getAuthToken();
      const userData = await StorageService.getUserData();

      if (token && userData) {
        setUser(userData);
        setIsLoading(false);
        return;
      }

      // StorageService에 없으면 Supabase 세션 확인
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (session?.user && !error) {
        // Supabase 사용자 정보를 AuthContext 형식에 맞게 변환
        const supabaseUser = session.user;
        const convertedUser: User = {
          id: supabaseUser.id,
          email: supabaseUser.email || '',
          username: supabaseUser.user_metadata?.username || supabaseUser.email?.split('@')[0] || 'user',
          profileImage: supabaseUser.user_metadata?.avatar_url || supabaseUser.user_metadata?.picture,
          bio: supabaseUser.user_metadata?.bio || '',
          followersCount: 0,
          followingCount: 0,
          postsCount: 0,
          createdAt: supabaseUser.created_at || new Date().toISOString(),
        };

        // StorageService에 저장하여 다음번에는 빠르게 로드
        await StorageService.saveAuthToken(session.access_token);
        await StorageService.saveUserData(convertedUser);
        setUser(convertedUser);
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (data: LoginRequest) => {
    try {
      const response = await api.login(data);
      await StorageService.saveAuthToken(response.token);
      await StorageService.saveUserData(response.user);
      setUser(response.user);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (data: RegisterRequest) => {
    try {
      const response = await api.register(data);
      await StorageService.saveAuthToken(response.token);
      await StorageService.saveUserData(response.user);
      setUser(response.user);
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await StorageService.clearAll();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
