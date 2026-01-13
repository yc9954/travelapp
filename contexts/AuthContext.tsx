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
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();

    // Supabase 인증 상태 변경 리스너 설정
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);

      if (event === 'SIGNED_IN' && session?.user) {
        // 로그인 성공 시 프로필 정보 가져오기
        const supabaseUser = session.user;

        try {
          // Profile 테이블에서 실제 데이터 가져오기
          const profile = await api.getUserProfile(supabaseUser.id);
          await StorageService.saveAuthToken(session.access_token);
          await StorageService.saveUserData(profile);
          setUser(profile);
        } catch (error) {
          console.error('Failed to load profile on sign in:', error);

          // Profile 로드 실패 시 기본 정보 사용
          const displayName = supabaseUser.user_metadata?.full_name
            || supabaseUser.user_metadata?.name
            || supabaseUser.user_metadata?.username
            || supabaseUser.email?.split('@')[0]
            || 'user';

          const convertedUser: User = {
            id: supabaseUser.id,
            email: supabaseUser.email || '',
            username: displayName,
            profileImage: supabaseUser.user_metadata?.avatar_url || supabaseUser.user_metadata?.picture,
            bio: supabaseUser.user_metadata?.bio || '',
            followersCount: 0,
            followingCount: 0,
            postsCount: 0,
            createdAt: supabaseUser.created_at || new Date().toISOString(),
          };

          await StorageService.saveAuthToken(session.access_token);
          await StorageService.saveUserData(convertedUser);
          setUser(convertedUser);
        }
      } else if (event === 'SIGNED_OUT') {
        // 로그아웃 시 상태 초기화
        await StorageService.clearAll();
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkAuth = async () => {
    try {
      // 먼저 Supabase 세션 확인 (AsyncStorage에서 자동 복원)
      const { data: { session }, error } = await supabase.auth.getSession();

      if (session?.user && !error) {
        console.log('✅ Supabase session found:', session.user.email);

        // Profile 정보 가져오기 (팔로워/팔로잉 카운트 포함)
        try {
          const profile = await api.getUserProfile(session.user.id);
          await StorageService.saveAuthToken(session.access_token);
          await StorageService.saveUserData(profile);
          setUser(profile);
          setIsLoading(false);
          return;
        } catch (profileError) {
          console.error('Failed to load profile, using basic user info:', profileError);
          // Profile 로드 실패 시 기본 정보 사용
        }

        // Profile 로드 실패 시 Supabase 사용자 정보 사용
        const supabaseUser = session.user;
        const displayName = supabaseUser.user_metadata?.full_name
          || supabaseUser.user_metadata?.name
          || supabaseUser.user_metadata?.username
          || supabaseUser.email?.split('@')[0]
          || 'user';

        const convertedUser: User = {
          id: supabaseUser.id,
          email: supabaseUser.email || '',
          username: displayName,
          profileImage: supabaseUser.user_metadata?.avatar_url || supabaseUser.user_metadata?.picture,
          bio: supabaseUser.user_metadata?.bio || '',
          followersCount: 0,
          followingCount: 0,
          postsCount: 0,
          createdAt: supabaseUser.created_at || new Date().toISOString(),
        };

        await StorageService.saveAuthToken(session.access_token);
        await StorageService.saveUserData(convertedUser);
        setUser(convertedUser);
      } else {
        console.log('❌ No Supabase session found');
        // Supabase 세션이 없지만 로컬 스토리지에 데이터가 있는 경우
        // 이는 이전 버전에서 마이그레이션된 사용자일 수 있음
        const token = await StorageService.getAuthToken();
        const userData = await StorageService.getUserData();

        if (token && userData) {
          console.log('⚠️ Local storage data found but Supabase session missing');
          console.log('⚠️ Please log out and log in again to restore full functionality');
          // 로컬 데이터를 사용하되, 기능 제한 경고
          setUser(userData);
        }
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
      await supabase.auth.signOut();
      await StorageService.clearAll();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const refreshAuth = async () => {
    await checkAuth();
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
        refreshAuth,
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
