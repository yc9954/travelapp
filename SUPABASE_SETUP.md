# Supabase 설정 가이드

이 앱은 Supabase를 백엔드로 사용하여 인증, 데이터베이스, 스토리지 기능을 제공합니다.

## 1. Supabase 프로젝트 생성

1. [Supabase](https://supabase.com)에 가입/로그인
2. "New Project" 클릭
3. 프로젝트 이름, 데이터베이스 비밀번호 설정
4. 리전 선택 (Seoul 권장)
5. 프로젝트 생성 대기 (약 2분)

## 2. 데이터베이스 스키마 생성

프로젝트가 생성되면:

1. 왼쪽 메뉴에서 **SQL Editor** 클릭
2. **New Query** 클릭
3. `supabase/migrations/001_initial_schema.sql` 파일의 내용을 복사
4. SQL Editor에 붙여넣기
5. **Run** 버튼 클릭하여 실행

이 스크립트는 다음을 생성합니다:
- `profiles` 테이블 (사용자 프로필)
- `posts` 테이블 (게시물)
- `likes` 테이블 (좋아요)
- `comments` 테이블 (댓글)
- Row Level Security 정책
- 자동 카운트 업데이트 트리거

## 3. 환경 변수 설정

1. Supabase 프로젝트 대시보드에서 **Settings** > **API** 이동
2. 다음 값들을 복사:
   - `Project URL`
   - `anon public` key

3. 프로젝트 루트에 `.env` 파일 생성:

```env
EXPO_PUBLIC_SUPABASE_URL=your_project_url_here
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

## 4. Google OAuth 설정 (선택사항)

Google 로그인을 사용하려면:

1. Supabase 대시보드에서 **Authentication** > **Providers** 이동
2. **Google** 선택
3. "Enable Google Provider" 토글 ON
4. [Google Cloud Console](https://console.cloud.google.com)에서:
   - OAuth 클라이언트 ID 생성
   - Authorized redirect URIs에 Supabase 콜백 URL 추가:
     ```
     https://[YOUR_PROJECT_ID].supabase.co/auth/v1/callback
     ```
5. Client ID와 Client Secret을 Supabase에 입력
6. **Save** 클릭

## 5. 이메일 인증 설정

기본적으로 Supabase는 이메일 확인을 요구합니다. 개발 중에는 비활성화할 수 있습니다:

1. **Authentication** > **Settings** 이동
2. "Enable email confirmations" 토글 OFF (개발 중)
3. 프로덕션에서는 ON으로 유지하는 것을 권장

## 6. Row Level Security (RLS) 정책

스키마 생성 시 RLS 정책이 자동으로 설정됩니다:

- **Profiles**: 모두가 볼 수 있고, 본인만 수정 가능
- **Posts**: 모두가 볼 수 있고, 본인만 생성/수정/삭제 가능
- **Likes**: 모두가 볼 수 있고, 본인만 추가/삭제 가능
- **Comments**: 모두가 볼 수 있고, 본인만 생성/수정/삭제 가능

## 7. 테스트

앱을 실행하고 다음을 테스트:

1. ✅ 이메일로 회원가입
2. ✅ 이메일로 로그인
3. ✅ Google 로그인 (설정한 경우)
4. ✅ 게시물 업로드
5. ✅ 좋아요 추가/제거
6. ✅ 댓글 작성
7. ✅ 프로필 보기

## 8. Supabase Storage 설정 (이미지 업로드)

향후 이미지 업로드를 위해:

1. **Storage** 메뉴 이동
2. **New bucket** 클릭
3. 버킷 이름: `post-images`
4. Public bucket 체크
5. **Create bucket**

이미지 업로드 구현은 추후 `uploadImage` 함수에서 처리됩니다.

## 문제 해결

### 데이터가 보이지 않음

- SQL Editor에서 `SELECT * FROM profiles;` 실행하여 데이터 확인
- RLS 정책이 올바르게 설정되었는지 확인

### 인증 에러

- `.env` 파일의 환경 변수가 올바른지 확인
- 앱을 재시작: `expo start --clear`

### 권한 에러

- RLS 정책 확인
- 사용자가 로그인되어 있는지 확인

## 추가 리소스

- [Supabase 문서](https://supabase.com/docs)
- [Supabase JavaScript 클라이언트](https://supabase.com/docs/reference/javascript/introduction)
- [Row Level Security 가이드](https://supabase.com/docs/guides/auth/row-level-security)
