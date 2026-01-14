# 환경 변수 확인 가이드

## 필수 환경 변수

`.env` 파일에 다음 환경 변수들이 설정되어 있어야 합니다:

### 1. Supabase 설정 (필수)
```env
EXPO_PUBLIC_SUPABASE_URL=https://[PROJECT_REF].supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 2. KIRI Engine API 키 (비디오 업로드용, 필수)
```env
EXPO_PUBLIC_KIRI_API_KEY=your-kiri-api-key-here
```

### 3. OpenAI API 키 (Travel AI Chat용, 선택사항)
```env
EXPO_PUBLIC_OPENAI_API_KEY=your-openai-api-key
```

## 확인 방법

터미널에서 다음 명령어로 확인할 수 있습니다:

```bash
# .env 파일 내용 확인 (일부만)
grep -E "EXPO_PUBLIC_" .env

# 또는 전체 내용 확인
cat .env
```

## 누락된 환경 변수가 있으면

1. `.env` 파일을 열어서 누락된 변수 추가
2. 앱 재시작 (환경 변수 변경 후 필수!)
   ```bash
   # 개발 서버 중지 후
   expo start --clear
   ```

## 환경 변수 확인 체크리스트

- [ ] `EXPO_PUBLIC_SUPABASE_URL` 설정됨
- [ ] `EXPO_PUBLIC_SUPABASE_ANON_KEY` 설정됨
- [ ] `EXPO_PUBLIC_KIRI_API_KEY` 설정됨 (비디오 업로드 기능 사용 시)
- [ ] `EXPO_PUBLIC_OPENAI_API_KEY` 설정됨 (Travel AI Chat 사용 시)
