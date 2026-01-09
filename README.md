# TravelSpace 3D

여행 사진을 3D로 변환하여 공유하는 소셜 미디어 앱

## 프로젝트 컨셉

일반적인 2D 사진이 아닌, 3D로 변환된 여행 사진을 올리고 공유할 수 있는 여행 전문 SNS입니다. 사용자는 자신의 여행 사진을 3D로 바꿔서 더 생생하고 입체적인 추억을 다른 사람들과 나눌 수 있습니다.

## 주요 기능

### 1. 인증
- 이메일 로그인/회원가입
- Google/Apple 소셜 로그인 (구현 예정)
- 자동 로그인 (토큰 기반)

### 2. 피드
- Instagram 스타일의 무한 스크롤 피드
- 3D 배지로 3D 게시물 구분
- 좋아요, 댓글 기능
- 위치 태그 및 해시태그

### 3. 사진 업로드 & 3D 변환
- 카메라로 직접 촬영 또는 갤러리에서 선택
- Luma AI를 활용한 자동 3D 변환
- 진행률 표시 및 변환 상태 추적
- 3D 변환 팁 제공

### 4. 프로필
- 사용자 정보 및 통계 (게시물, 팔로워, 팔로잉)
- 3x3 그리드 갤러리
- 3D 게시물 배지 표시
- 프로필 편집 (구현 예정)

## 기술 스택

- **프레임워크**: React Native + Expo
- **라우팅**: Expo Router (파일 기반 라우팅)
- **상태 관리**: React Context API
- **네비게이션**: React Navigation (Bottom Tabs)
- **스타일링**: StyleSheet
- **HTTP 클라이언트**: Axios
- **이미지 처리**: Expo Image Picker
- **스토리지**: AsyncStorage
- **3D 변환**: Luma AI API

## 프로젝트 구조

```
travelapp/
├── app/                      # 화면 및 라우팅
│   ├── (auth)/              # 인증 화면
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── (tabs)/              # 메인 탭 화면
│   │   ├── feed.tsx
│   │   ├── upload.tsx
│   │   ├── profile.tsx
│   │   └── _layout.tsx
│   └── _layout.tsx          # 루트 레이아웃
├── components/              # 재사용 가능한 컴포넌트
│   └── PostCard.tsx
├── contexts/                # Context API
│   └── AuthContext.tsx
├── services/                # API 및 서비스
│   ├── api.ts              # 백엔드 API
│   ├── luma.ts             # Luma AI 서비스
│   └── storage.ts          # AsyncStorage 유틸
└── types/                   # TypeScript 타입 정의
    └── index.ts
```

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. Mock 모드 vs 실제 API 모드

**현재 기본 설정: Mock 모드 (백엔드 없이 바로 테스트 가능)**

#### Mock 모드 (기본값)
백엔드 API 없이도 앱을 바로 실행하고 테스트할 수 있습니다!

`services/api.ts`:
```typescript
const USE_MOCK_API = true;  // Mock 모드 활성화
```

`services/luma.ts`:
```typescript
const USE_MOCK_LUMA = true;  // Mock 3D 변환 활성화
```

**Mock 모드 기능:**
- 더미 데이터로 피드 표시
- 어떤 이메일/비밀번호든 로그인 가능
- 회원가입 즉시 완료
- 좋아요, 게시물 업로드 등 모든 기능 작동
- 3D 변환 시뮬레이션 (3초 후 완료)

#### 실제 API 모드
백엔드 서버를 연동하려면:

1. `services/api.ts`에서 Mock 모드 비활성화:
```typescript
const USE_MOCK_API = false;
```

2. API URL 설정:
```typescript
const API_BASE_URL = 'https://your-api-url.com/api';
```

3. `services/luma.ts`에서 Luma API 설정:
```typescript
const USE_MOCK_LUMA = false;
const LUMA_API_KEY = 'your_luma_api_key_here';
```

### 3. 앱 실행

```bash
npx expo start
```

실행 옵션:
- Android: `a` 키 또는 `npm run android`
- iOS: `i` 키 또는 `npm run ios`
- Web: `w` 키 또는 `npm run web`

## 개발 환경

- Node.js 18+
- Expo SDK 54
- React Native 0.81.5
- TypeScript 5.9.2

## 주요 패키지

- `expo-router`: 파일 기반 라우팅
- `expo-image-picker`: 이미지 선택 및 카메라
- `expo-linear-gradient`: 그라디언트 배경
- `@react-native-async-storage/async-storage`: 로컬 저장소
- `axios`: HTTP 클라이언트
- `@expo/vector-icons`: 아이콘

## API 명세

백엔드 API는 다음 엔드포인트를 제공해야 합니다:

### 인증
- `POST /api/auth/login` - 로그인
- `POST /api/auth/register` - 회원가입

### 게시물
- `GET /api/posts/feed` - 피드 조회
- `GET /api/posts/user/:userId` - 사용자 게시물 조회
- `POST /api/posts` - 게시물 작성
- `POST /api/posts/:id/like` - 좋아요
- `DELETE /api/posts/:id/like` - 좋아요 취소

### 사용자
- `GET /api/users/:userId` - 사용자 프로필 조회

### 업로드
- `POST /api/upload` - 이미지 업로드

## 향후 개발 계획

- [ ] 댓글 기능
- [ ] 팔로우/언팔로우
- [ ] 검색 기능 (위치, 해시태그, 사용자)
- [ ] 푸시 알림
- [ ] 프로필 편집
- [ ] 3D 뷰어 (회전, 확대/축소)
- [ ] AR 기능
- [ ] 여행 루트 맵
- [ ] 다크 모드

## 라이선스

MIT

## 문의

프로젝트 관련 문의사항이 있으시면 이슈를 등록해주세요.
