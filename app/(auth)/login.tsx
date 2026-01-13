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

        console.log('OAuth result:', result.type);

        // URL에서 토큰 파싱하고 세션 설정
        if ((result.type === 'success' || result.type === 'dismiss') && result.url) {
          try {
            console.log('Parsing URL for tokens');

            // URL에서 토큰 추출
            let accessToken: string | null = null;
            let refreshToken: string | null = null;

            // Hash fragment (#) 파싱
            const hashIndex = result.url.indexOf('#');
            if (hashIndex !== -1) {
              const hashFragment = result.url.substring(hashIndex + 1);
              const hashParams = new URLSearchParams(hashFragment);
              accessToken = hashParams.get('access_token');
              refreshToken = hashParams.get('refresh_token');
            }

            // Query params (?) 파싱 (fallback)
            if (!accessToken) {
              try {
                const url = new URL(result.url);
                accessToken = url.searchParams.get('access_token');
                refreshToken = url.searchParams.get('refresh_token');
              } catch (e) {
                // Custom scheme일 경우 정규식 사용
                const accessMatch = result.url.match(/[#&]access_token=([^&]+)/);
                const refreshMatch = result.url.match(/[#&]refresh_token=([^&]+)/);
                if (accessMatch) accessToken = decodeURIComponent(accessMatch[1]);
                if (refreshMatch) refreshToken = decodeURIComponent(refreshMatch[1]);
              }
            }

            console.log('Tokens found:', { hasAccessToken: !!accessToken, hasRefreshToken: !!refreshToken });

            if (accessToken) {
              // Supabase 세션 설정 - AuthContext의 onAuthStateChange가 자동으로 사용자 정보를 업데이트함
              const { error: sessionError } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken || '',
              });

              if (sessionError) {
                console.error('Session error:', sessionError);
                Alert.alert('로그인 실패', '인증 처리에 실패했습니다.');
                setIsGoogleLoading(false);
                return;
              }

              // AuthContext가 onAuthStateChange를 통해 사용자 정보를 업데이트할 시간을 줌
              await new Promise(resolve => setTimeout(resolve, 500));

              console.log('Google login success, navigating to feed');
              router.replace('/(tabs)/feed');
            } else {
              console.error('No access token found in URL');
              Alert.alert('로그인 실패', '인증 토큰을 찾을 수 없습니다.');
              setIsGoogleLoading(false);
            }
          } catch (urlError: any) {
            console.error('URL parsing error:', urlError);
            Alert.alert('로그인 실패', 'URL 파싱 중 오류가 발생했습니다.');
            setIsGoogleLoading(false);
          }
        } else if (result.type === 'cancel') {
          console.log('User cancelled the login flow');
          setIsGoogleLoading(false);
        } else {
          console.log('OAuth flow did not complete');
          setIsGoogleLoading(false);
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
