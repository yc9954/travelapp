# KIRI Engine Webhook 설정 가이드 (Supabase)

이 가이드는 Supabase를 사용하여 KIRI Engine webhook을 처리하는 방법을 설명합니다.

## 개요

KIRI Engine이 비디오 처리를 완료하면 webhook을 통해 Supabase Edge Function으로 알림을 보냅니다. Edge Function은 데이터베이스를 업데이트하고, 앱은 Supabase Realtime을 통해 실시간으로 상태 변경을 받습니다.

## 설정 단계

### 1. 데이터베이스 마이그레이션 실행

1. Supabase 대시보드에서 **SQL Editor** 열기
2. `supabase/migrations/004_add_kiri_tasks_table.sql` 파일 내용 복사
3. SQL Editor에 붙여넣고 **Run** 실행

이 마이그레이션은 `kiri_tasks` 테이블을 생성하여 작업 상태를 저장합니다.

### 2. Supabase Edge Function 배포

#### 2.1 Supabase CLI 설치 (아직 설치하지 않은 경우)

⚠️ **중요**: Supabase CLI는 `npm install -g`로 설치할 수 없습니다!

**macOS (Homebrew 권장):**
```bash
brew install supabase/tap/supabase
```

**다른 방법들:**
- **npm (로컬 프로젝트에 설치):**
  ```bash
  npm install supabase --save-dev
  npx supabase --help
  ```

- **직접 다운로드:**
  ```bash
  # macOS
  curl -L https://github.com/supabase/cli/releases/latest/download/supabase_darwin_amd64.tar.gz | tar -xz
  sudo mv supabase /usr/local/bin/
  ```

- **다른 설치 방법:** [Supabase CLI 공식 문서](https://github.com/supabase/cli#install-the-cli) 참고

**설치 확인:**
```bash
supabase --version
```

#### 2.2 Supabase 프로젝트 로그인

```bash
supabase login
```

브라우저가 열리면 GitHub 계정으로 로그인합니다.

#### 2.3 프로젝트 링크

프로젝트 ref는 Supabase 대시보드 URL에서 확인할 수 있습니다:
`https://app.supabase.com/project/[PROJECT_REF]`

```bash
supabase link --project-ref your-project-ref
```

또는 대화형 모드로:
```bash
supabase link
```

#### 2.4 Edge Function 배포

**npm으로 설치한 경우 (로컬):**
```bash
npx supabase functions deploy kiri-webhook
```

**전역 설치한 경우:**
```bash
supabase functions deploy kiri-webhook
```

배포 후 Edge Function URL이 표시됩니다:
```
https://[PROJECT_REF].supabase.co/functions/v1/kiri-webhook
```

**배포 확인:**
Supabase 대시보드 → **Edge Functions**에서 `kiri-webhook` 함수가 보이는지 확인하세요.

### 3. KIRI Engine Webhook 설정

1. KIRI Engine 대시보드에서 **Webhooks** 섹션으로 이동
2. **Add Webhook** 클릭
3. Webhook URL 입력:
   ```
   https://[YOUR_PROJECT_REF].supabase.co/functions/v1/kiri-webhook
   ```
4. 이벤트 선택: `task.completed`, `task.failed` 등
5. Webhook 저장

### 4. API 키 및 환경 변수 설정

#### 4.1 앱 환경 변수 (`.env` 파일)

프로젝트 루트의 `.env` 파일에 다음을 추가:

```env
# Supabase 설정 (이미 있을 수 있음)
EXPO_PUBLIC_SUPABASE_URL=https://[PROJECT_REF].supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# KIRI Engine API 키 (필수!)
EXPO_PUBLIC_KIRI_API_KEY=your-kiri-api-key-here
```

**KIRI Engine API 키 얻는 방법:**
1. [KIRI Engine](https://kiriengine.app)에 가입/로그인
2. 대시보드에서 **API Keys** 또는 **Settings** 섹션으로 이동
3. API 키 생성 또는 복사

#### 4.2 Edge Function 환경 변수 (자동 설정됨)

Supabase Edge Function을 배포하면 다음 환경 변수가 **자동으로 설정**됩니다:
- `SUPABASE_URL` - Supabase 프로젝트 URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service Role 키 (RLS 우회 가능)

**수동으로 확인/설정하려면:**
```bash
# Edge Function 환경 변수 확인
# npm으로 설치한 경우
npx supabase secrets list

# 전역 설치한 경우
supabase secrets list

# 필요시 수동 설정 (일반적으로 불필요)
npx supabase secrets set SUPABASE_URL=your-url
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
# 또는 (전역 설치 시)
supabase secrets set SUPABASE_URL=your-url
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Service Role Key 찾는 방법:**
1. Supabase 대시보드 → **Settings** → **API**
2. **Project API keys** 섹션에서 **service_role** 키 복사
   - ⚠️ **주의**: 이 키는 절대 클라이언트에 노출하면 안 됩니다!
   - Edge Function에서만 사용됩니다.

## 작동 방식

### 1. 비디오 업로드
- 사용자가 비디오를 촬영하고 업로드
- 앱이 KIRI Engine에 비디오 업로드
- `kiri_tasks` 테이블에 작업 레코드 생성
- KIRI Engine에 webhook URL 자동 설정

### 2. 처리 중
- KIRI Engine이 비디오 처리 시작
- 앱은 Supabase Realtime을 통해 상태 변경 감지
- 폴링도 병행하여 안정성 확보

### 3. 완료
- KIRI Engine이 처리 완료
- Webhook이 Supabase Edge Function 호출
- Edge Function이 `kiri_tasks` 테이블 업데이트
- Supabase Realtime이 앱에 변경사항 전송
- 앱이 자동으로 편집 화면으로 이동

## API 키 요약

### 필요한 API 키

1. **KIRI Engine API Key** (필수)
   - 용도: 비디오를 KIRI Engine에 업로드
   - 위치: `.env` 파일의 `EXPO_PUBLIC_KIRI_API_KEY`
   - 얻는 방법: KIRI Engine 대시보드 → API Keys

2. **Supabase Anon Key** (필수)
   - 용도: 앱에서 Supabase 데이터베이스 접근
   - 위치: `.env` 파일의 `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   - 얻는 방법: Supabase 대시보드 → Settings → API

3. **Supabase Service Role Key** (자동 설정)
   - 용도: Edge Function에서 데이터베이스 업데이트 (RLS 우회)
   - 위치: Edge Function 환경 변수 (자동 설정됨)
   - 얻는 방법: Supabase 대시보드 → Settings → API → service_role key
   - ⚠️ **절대 클라이언트에 노출하지 마세요!**

4. **KIRI Webhook Secret** (선택사항, 보안 강화용)
   - 용도: Webhook 요청 검증
   - 위치: Edge Function 환경 변수
   - 설정:
     ```bash
     # npm으로 설치한 경우
     npx supabase secrets set KIRI_WEBHOOK_SECRET=your-secret
     
     # 전역 설치한 경우
     supabase secrets set KIRI_WEBHOOK_SECRET=your-secret
     ```

## 보안 고려사항

현재 구현은 개발용입니다. 프로덕션에서는:

1. **Webhook 서명 검증 추가** (권장)
   - KIRI Engine이 webhook에 서명을 포함하는 경우
   - Edge Function 코드의 주석 처리된 검증 로직 활성화
   - `KIRI_WEBHOOK_SECRET` 환경 변수 설정

2. **RLS 정책 강화**
   - Edge Function은 Service Role을 사용하여 RLS를 우회
   - 이는 의도된 동작이며, Edge Function은 신뢰할 수 있는 서버 코드입니다

3. **Rate Limiting**
   - Edge Function에 rate limiting 추가 고려
   - Supabase 대시보드에서 설정 가능

## 테스트

### Edge Function 로컬 테스트

**npm으로 설치한 경우:**
```bash
npx supabase functions serve kiri-webhook
```

**전역 설치한 경우:**
```bash
supabase functions serve kiri-webhook
```

로컬에서 테스트하려면:
```bash
curl -X POST http://localhost:54321/functions/v1/kiri-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "serialize": "test-123",
    "status": "completed",
    "download_url": "https://example.com/model.glb"
  }'
```

**로컬 Supabase 시작 (필요한 경우):**
```bash
# Supabase 로컬 개발 환경 시작
npx supabase start
# 또는
supabase start
```

### Webhook 테스트

KIRI Engine 대시보드에서 webhook 테스트 기능을 사용하거나, 실제 작업을 생성하여 테스트할 수 있습니다.

## 문제 해결

### Webhook이 작동하지 않는 경우

1. Edge Function 로그 확인:
   ```bash
   # npm으로 설치한 경우
   npx supabase functions logs kiri-webhook
   
   # 전역 설치한 경우
   supabase functions logs kiri-webhook
   ```

2. Supabase 대시보드에서 **Edge Functions** > **Logs** 확인

3. KIRI Engine webhook 설정 확인:
   - URL이 정확한지
   - 이벤트가 올바르게 선택되었는지

4. Edge Function이 배포되었는지 확인:
   ```bash
   # 함수 목록 확인
   npx supabase functions list
   # 또는
   supabase functions list
   ```

### Realtime이 작동하지 않는 경우

1. Supabase Realtime이 활성화되어 있는지 확인
2. `kiri_tasks` 테이블에 대한 Realtime이 활성화되어 있는지 확인
3. 앱에서 Supabase 연결 상태 확인

## 참고 자료

- [KIRI Engine Webhook 문서](https://docs.kiriengine.app/category/webhooks)
- [Supabase Edge Functions 문서](https://supabase.com/docs/guides/functions)
- [Supabase Realtime 문서](https://supabase.com/docs/guides/realtime)
