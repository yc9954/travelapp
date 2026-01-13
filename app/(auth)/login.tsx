import { Ionicons } from '@expo/vector-icons';
import * as AuthSession from 'expo-auth-session';
import { Link, router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

// WebBrowser를 완료 후 닫도록 설정
WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, refreshAuth } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('오류', '이메일과 비밀번호를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    try {
      await login({ email, password });
      router.replace('/(tabs)/feed');
    } catch (error: any) {
      Alert.alert(
        '로그인 실패',
        error.response?.data?.message || '이메일 또는 비밀번호가 올바르지 않습니다.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      setIsGoogleLoading(true);
      
      // 여러 환경 변수 이름 지원
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.YOUR_REACT_NATIVE_SUPABASE_URL;
      const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.YOUR_REACT_NATIVE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseAnonKey) {
        Alert.alert(
          '설정 필요',
          'Supabase 환경 변수가 설정되지 않았습니다.\n\n.env 파일에 EXPO_PUBLIC_SUPABASE_URL과 EXPO_PUBLIC_SUPABASE_ANON_KEY를 추가해주세요.'
        );
        setIsGoogleLoading(false);
        return;
      }

      // Supabase OAuth URL 생성
      const redirectUrl = AuthSession.makeRedirectUri({
        scheme: 'splatspace',
        useProxy: false,
      });

      console.log('Redirect URL:', redirectUrl);

      // 인증 상태 변경을 감지하기 위한 Promise
      let authResolved = false;
      const authPromise = new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          if (!authResolved) {
            authResolved = true;
            reject(new Error('인증 타임아웃'));
          }
        }, 60000); // 60초 타임아웃

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          console.log('Auth state changed during OAuth:', event);
          if (event === 'SIGNED_IN' && session?.user && !authResolved) {
            clearTimeout(timeout);
            authResolved = true;
            subscription.unsubscribe();
            resolve();
          }
        });
      });

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: false,
        },
      });

      if (error) {
        console.error('Supabase OAuth error:', error);
        Alert.alert('로그인 실패', error.message || 'Google 로그인에 실패했습니다.');
        setIsGoogleLoading(false);
        return;
      }

      if (data?.url) {
        console.log('Opening OAuth URL:', data.url);
        
        // OAuth URL로 브라우저 열기
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectUrl
        );

        console.log('OAuth result:', result.type, result.url);

        // 인증 상태 변경을 기다림 (onAuthStateChange가 처리)
        try {
          await Promise.race([
            authPromise,
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 30000))
          ]);
          
          // 인증이 완료되면 사용자 정보 확인
          const { data: { user: supabaseUser } } = await supabase.auth.getUser();
          if (supabaseUser) {
            console.log('OAuth completed via state change, user:', supabaseUser.email);
            await refreshAuth();
            router.replace('/(tabs)/feed');
            return;
          }
        } catch (authError) {
          console.log('Auth state change not detected, trying URL parsing...');
        }

        // URL에서 직접 토큰을 파싱하는 방법도 시도
        if (result.type === 'success' && result.url) {
          try {
            console.log('Parsing URL for tokens:', result.url);
            
            // exp:// 같은 커스텀 스킴을 처리하기 위해 정규식으로 먼저 파싱
            let accessToken: string | null = null;
            let refreshToken: string | null = null;

            // Hash fragment 전체를 추출 (# 이후의 모든 내용)
            const hashIndex = result.url.indexOf('#');
            if (hashIndex !== -1) {
              const hashFragment = result.url.substring(hashIndex + 1);
              console.log('Hash fragment:', hashFragment.substring(0, 100) + '...');
              
              // Hash fragment를 URLSearchParams로 파싱
              try {
                const hashParams = new URLSearchParams(hashFragment);
                accessToken = hashParams.get('access_token');
                refreshToken = hashParams.get('refresh_token');
                console.log('Parsed from hash params:', { hasAccessToken: !!accessToken, hasRefreshToken: !!refreshToken });
              } catch (e) {
                console.log('Failed to parse hash as URLSearchParams, trying regex...');
              }
            }

            // 정규식으로도 시도 (fallback)
            if (!accessToken) {
              const hashMatch = result.url.match(/#access_token=([^&]+)/);
              if (hashMatch) {
                accessToken = decodeURIComponent(hashMatch[1]);
              }
            }

            if (!refreshToken) {
              const hashRefreshMatch = result.url.match(/#refresh_token=([^&]+)/);
              if (hashRefreshMatch) {
                refreshToken = decodeURIComponent(hashRefreshMatch[1]);
              }
            }

            // Query params에서도 시도 (?access_token=...)
            if (!accessToken) {
              const queryMatch = result.url.match(/[?&]access_token=([^&]+)/);
              if (queryMatch) {
                accessToken = decodeURIComponent(queryMatch[1]);
              }
            }

            if (!refreshToken) {
              const queryRefreshMatch = result.url.match(/[?&]refresh_token=([^&]+)/);
              if (queryRefreshMatch) {
                refreshToken = decodeURIComponent(queryRefreshMatch[1]);
              }
            }

            // 표준 URL 파싱도 시도 (fallback)
            if (!accessToken || !refreshToken) {
              try {
                const url = new URL(result.url);
                if (!accessToken) {
                  accessToken = url.searchParams.get('access_token');
                  if (!accessToken && url.hash) {
                    const hashParams = new URLSearchParams(url.hash.substring(1));
                    accessToken = hashParams.get('access_token');
                  }
                }
                if (!refreshToken) {
                  refreshToken = url.searchParams.get('refresh_token');
                  if (!refreshToken && url.hash) {
                    const hashParams = new URLSearchParams(url.hash.substring(1));
                    refreshToken = hashParams.get('refresh_token');
                  }
                }
              } catch (urlError) {
                console.log('Standard URL parsing failed (expected for custom schemes):', urlError);
              }
            }

            console.log('Tokens extracted:', { hasAccessToken: !!accessToken, hasRefreshToken: !!refreshToken });

            if (accessToken) {
              console.log('Processing tokens...');
              
              // JWT 토큰에서 사용자 정보 추출 (setSession이 실패할 수 있으므로)
              let userData;
              try {
                // JWT 디코딩
                const jwtParts = accessToken.split('.');
                if (jwtParts.length === 3) {
                  // Base64 URL 디코딩
                  const base64Url = jwtParts[1].replace(/-/g, '+').replace(/_/g, '/');
                  const base64 = base64Url + '='.repeat((4 - base64Url.length % 4) % 4);
                  const payload = JSON.parse(atob(base64));
                  
                  console.log('Decoded JWT payload:', { sub: payload.sub, email: payload.email });
                  
                  // JWT에서 사용자 정보 추출
                  userData = {
                    id: payload.sub,
                    email: payload.email || '',
                    username: payload.user_metadata?.full_name || payload.user_metadata?.name || payload.email?.split('@')[0] || 'user',
                    profileImage: payload.user_metadata?.avatar_url || payload.user_metadata?.picture,
                    bio: payload.user_metadata?.bio || '',
                    followersCount: 0,
                    followingCount: 0,
                    postsCount: 0,
                    createdAt: payload.iat ? new Date(payload.iat * 1000).toISOString() : new Date().toISOString(),
                  };
                } else {
                  throw new Error('Invalid JWT format');
                }
              } catch (jwtError) {
                console.error('JWT decoding error:', jwtError);
                // JWT 디코딩 실패 시 setSession 시도
                console.log('Falling back to setSession...');
                
                const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
                  access_token: accessToken,
                  refresh_token: refreshToken || '',
                });

                if (sessionError) {
                  console.error('Session error:', sessionError);
                  Alert.alert('로그인 실패', '인증 처리에 실패했습니다. ' + sessionError.message);
                  return;
                }

                // Supabase에서 사용자 정보 가져오기
                const { data: { user: supabaseUser }, error: userError } = await supabase.auth.getUser();

                if (userError || !supabaseUser) {
                  console.error('Get user error:', userError);
                  Alert.alert('로그인 실패', userError?.message || '사용자 정보를 가져오는데 실패했습니다.');
                  return;
                }

                userData = {
                  id: supabaseUser.id,
                  email: supabaseUser.email || '',
                  username: supabaseUser.user_metadata?.username || supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'user',
                  profileImage: supabaseUser.user_metadata?.avatar_url || supabaseUser.user_metadata?.picture,
                  bio: supabaseUser.user_metadata?.bio || '',
                  followersCount: 0,
                  followingCount: 0,
                  postsCount: 0,
                  createdAt: supabaseUser.created_at || new Date().toISOString(),
                };
              }

              // AuthContext에 사용자 정보 저장
              const { StorageService } = await import('../../services/storage');
              await StorageService.saveAuthToken(accessToken);
              await StorageService.saveUserData(userData);

              // AuthContext 상태 즉시 업데이트
              await refreshAuth();

              console.log('Google login success, navigating to feed');
              // 홈 화면으로 이동
              router.replace('/(tabs)/feed');
            } else {
              console.error('No access token found in URL');
              Alert.alert('로그인 실패', '인증 토큰을 찾을 수 없습니다.');
            }
          } catch (urlError: any) {
            console.error('URL parsing error:', urlError);
            Alert.alert('로그인 실패', 'URL 파싱 중 오류가 발생했습니다: ' + urlError.message);
          }
        } else if (result.type === 'cancel') {
          console.log('User cancelled the login flow');
          Alert.alert('로그인 취소', '로그인이 취소되었습니다.');
        } else if (result.type === 'dismiss') {
          console.log('Auth session dismissed');
          // dismiss 시에도 URL이 있을 수 있으므로 확인
          if (result.url) {
            console.log('Dismissed but URL present:', result.url);
            // URL에 토큰이 있는지 확인
            try {
              const url = new URL(result.url);
              const hashParams = new URLSearchParams(url.hash.substring(1));
              const accessToken = hashParams.get('access_token') || url.searchParams.get('access_token');
              
              if (accessToken) {
                console.log('Found token in dismissed result, processing...');
                // 토큰이 있으면 처리
                const { error: sessionError } = await supabase.auth.setSession({
                  access_token: accessToken,
                  refresh_token: hashParams.get('refresh_token') || url.searchParams.get('refresh_token') || '',
                });

                if (!sessionError) {
                  await refreshAuth();
                  router.replace('/(tabs)/feed');
                  return;
                }
              } else {
                // URL은 있지만 토큰이 없는 경우 - OAuth 플로우가 완료되지 않았을 수 있음
                console.log('Dismissed with URL but no token found');
                // 잠시 기다렸다가 인증 상태 확인
                setTimeout(async () => {
                  const { data: { session } } = await supabase.auth.getSession();
                  if (session?.user) {
                    console.log('Session found after dismiss, user:', session.user.email);
                    await refreshAuth();
                    router.replace('/(tabs)/feed');
                  }
                }, 1000);
              }
            } catch (e) {
              console.error('Error processing dismissed URL:', e);
            }
          } else {
            // URL도 없는 경우 - OAuth 플로우가 완료되지 않았을 수 있음
            console.log('Dismissed without URL - OAuth flow may not have completed');
            // 잠시 기다렸다가 인증 상태 확인
            setTimeout(async () => {
              const { data: { session } } = await supabase.auth.getSession();
              if (session?.user) {
                console.log('Session found after dismiss, user:', session.user.email);
                await refreshAuth();
                router.replace('/(tabs)/feed');
              }
            }, 1000);
          }
        } else {
          console.log('Unexpected result type:', result.type, result);
          // 다른 타입도 URL이 있으면 처리 시도
          if (result.url) {
            console.log('Processing URL from unexpected result type:', result.url);
          }
        }
      } else {
        console.error('No OAuth URL returned from Supabase');
        Alert.alert('로그인 실패', 'OAuth URL을 받아오지 못했습니다.');
      }
    } catch (error: any) {
      console.error('Google sign in error:', error);
      Alert.alert('로그인 실패', error.message || 'Google 로그인에 실패했습니다.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          {/* 로고 섹션 */}
          <View style={styles.logoContainer}>
            <Text style={styles.appName}>SplatSpace</Text>
          </View>

          {/* 로그인 폼 */}
          <View style={styles.formContainer}>
            <TextInput
              style={styles.input}
              placeholder="이메일"
              placeholderTextColor="#999999"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />

            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="비밀번호"
                placeholderTextColor="#999999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoComplete="password"
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name={showPassword ? "eye-off" : "eye"}
                  size={20}
                  color="#999999"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.loginButtonText}>로그인</Text>
              )}
            </TouchableOpacity>

            {/* 구분선 */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>또는</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google 로그인 버튼 */}
            <TouchableOpacity
              style={[styles.googleButton, isGoogleLoading && styles.googleButtonDisabled]}
              onPress={signInWithGoogle}
              disabled={isGoogleLoading}
            >
              {isGoogleLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="logo-google" size={20} color="#FFFFFF" style={styles.googleIcon} />
                  <Text style={styles.googleButtonText}>Google로 로그인</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* 회원가입 및 기타 링크 */}
          <View style={styles.footer}>
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity>
                <Text style={styles.footerLink}>회원가입</Text>
              </TouchableOpacity>
            </Link>
            <Text style={styles.footerDivider}>|</Text>
            <TouchableOpacity>
              <Text style={styles.footerLink}>아이디 찾기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  appName: {
    fontSize: 25,
    color: '#000000',
    letterSpacing: 3,
    fontWeight: '300'
  },
  formContainer: {
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#000000',
    marginBottom: 10,
    backgroundColor: '#FFFFFF',
  },
  passwordContainer: {
    position: 'relative',
    marginBottom: 10,
  },
  passwordInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    paddingRight: 45,
    fontSize: 15,
    color: '#000000',
    backgroundColor: '#FFFFFF',
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    top: 14,
    padding: 4,
  },
  loginButton: {
    backgroundColor: '#000000',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#999999',
    fontSize: 14,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4285F4',
    borderRadius: 8,
    paddingVertical: 16,
    marginTop: 8,
  },
  googleButtonDisabled: {
    opacity: 0.7,
  },
  googleIcon: {
    marginRight: 8,
  },
  googleButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  footerLink: {
    color: '#666666',
    fontSize: 14,
  },
  footerDivider: {
    color: '#CCCCCC',
    fontSize: 14,
  },
});
