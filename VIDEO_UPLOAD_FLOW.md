# 비디오 업로드 → 게시 플로우

## 현재 플로우

### 1. 비디오 촬영 (업로드 탭)
- 사용자가 "Record Video" 버튼 클릭
- 비디오 촬영 (최대 3분)
- 자동으로 KIRI Engine에 업로드

### 2. 처리 대기 화면
- `kiri-processing.tsx` 화면으로 자동 이동
- 처리 상태 실시간 모니터링 (Supabase Realtime + 폴링)
- 진행률 표시

### 3. 처리 완료 시
- 자동으로 `edit-asset.tsx` 화면으로 이동
- 3D 모델이 로드됨

### 4. 편집 및 게시 (수동 단계)
- 사용자가 **수동으로** 다음을 입력해야 함:
  - 캡션 (필수)
  - 위치 (선택)
  - 해시태그 (선택)
- "게시" 버튼 클릭
- 게시 완료!

## 자동 게시까지는 안 됩니다

현재 구현에서는 **자동으로 게시까지는 되지 않습니다**. 

이유:
- 사용자가 캡션, 위치, 해시태그를 입력해야 함
- 게시 전에 3D 모델을 확인하고 편집할 수 있어야 함
- UX상 사용자가 최종 확인 후 게시하는 것이 좋음

## 자동 게시를 원한다면

만약 자동 게시 기능을 추가하고 싶다면, `kiri-processing.tsx`에서 처리 완료 시 바로 게시하도록 수정할 수 있습니다:

```typescript
// 처리 완료 시
if (task.status === 'completed' && task.download_url) {
  // 자동으로 게시 (기본 캡션 사용)
  await api.createPost({
    imageUrl: params.videoUri || '',
    image3dUrl: task.download_url,
    is3D: true,
    caption: 'Video processed with KIRI Engine',
    hashtags: ['KIRI', '3D', 'GaussianSplatting'],
  });
  
  router.replace('/(tabs)/feed');
}
```

하지만 현재는 사용자가 정보를 입력하고 확인 후 게시하는 것이 더 나은 UX입니다.
