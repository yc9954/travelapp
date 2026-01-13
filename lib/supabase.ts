import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { AppState } from 'react-native'
import 'react-native-url-polyfill/auto'

// 환경 변수 로드
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY

// 디버깅: 환경 변수 로드 확인
console.log('🔍 환경 변수 체크:');
console.log('  EXPO_PUBLIC_SUPABASE_URL:', supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : '❌ 없음');
console.log('  EXPO_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 30)}...` : '❌ 없음');

// 환경 변수가 없을 때 더미 클라이언트 생성 (앱 크래시 방지)
let supabase: SupabaseClient;
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다!');
  console.error('📝 프로젝트 루트에 .env 파일을 생성하고 다음을 추가하세요:');
  console.error('   EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co');
  console.error('   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key');
  console.error('📖 자세한 내용은 SUPABASE_SETUP.md를 참고하세요.');
  // 더미 URL로 클라이언트 생성 (실제 사용 불가)
  supabase = createClient('https://placeholder.supabase.co', 'placeholder-key', {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
} else {
  console.log('✅ Supabase 클라이언트 생성 중...');
  console.log('  URL:', supabaseUrl);
  console.log('  Key (처음 30자):', supabaseAnonKey.substring(0, 30) + '...');
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
  console.log('✅ Supabase 클라이언트 생성 완료');

  // Tells Supabase Auth to continuously refresh the session automatically
  // if the app is in the foreground. When this is added, you will continue
  // to receive `onAuthStateChange` events with the `TOKEN_REFRESHED` or
  // `SIGNED_OUT` event if the user's session is terminated. This should
  // only be registered once.
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      supabase.auth.startAutoRefresh()
    } else {
      supabase.auth.stopAutoRefresh()
    }
  })
}

export { supabase }
