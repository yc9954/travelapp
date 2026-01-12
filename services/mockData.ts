import type { User, Post } from '../types';

// Mock 사용자 데이터
export const mockUsers: User[] = [
  {
    id: '1',
    email: 'test@example.com',
    username: 'traveler123',
    profileImage: 'https://cdn-luma.com/c5464e01c904a033180b9f87ba7e61fe363ab854a8842a9f66dbb99cffc4dc95/Arosa_Hörnli_Switzerland_thumb.jpg',
    bio: '가우시안 스플래팅으로 세상을 기록합니다 ✨',
    followersCount: 1234,
    followingCount: 567,
    postsCount: 42,
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    email: 'user2@example.com',
    username: 'worldexplorer',
    profileImage: 'https://cdn-luma.com/dae39f9834ce5ff37efd798c27669caad8f67969a188f74a2e387607773b3fa9/MIT_WPU_Globe_thumb.jpg',
    bio: '🌍 3D로 여행을 공유하는 크리에이터',
    followersCount: 5678,
    followingCount: 890,
    postsCount: 128,
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    email: 'user3@example.com',
    username: 'photographer',
    profileImage: 'https://cdn-luma.com/998f66a10b35ecdc8ff532714eccd37ef567ba190b6b9a45833975e5b48fdf05/Dandelion_thumb.jpg',
    bio: '📸 가우시안 스플래팅 아티스트',
    followersCount: 9876,
    followingCount: 234,
    postsCount: 256,
    createdAt: new Date().toISOString(),
  },
];

// Mock 게시물 데이터
// Luma AI capture URL 형식: https://lumalabs.ai/capture/{uuid}
// 실제 존재하는 Luma Gaussian Splatting 에셋 사용
export const mockPosts: Post[] = [
  {
    id: '1',
    userId: '2',
    user: mockUsers[1],
    imageUrl: 'https://cdn-luma.com/c5464e01c904a033180b9f87ba7e61fe363ab854a8842a9f66dbb99cffc4dc95/Arosa_Hörnli_Switzerland_thumb.jpg',
    image3dUrl: 'https://lumalabs.ai/capture/4da7cf32-865a-4515-8cb9-9dfc574c90c2',
    is3D: true,
    caption: '스위스 알프스의 아름다운 설경! 360도 파노라마로 즐겨보세요 🏔️✨',
    location: 'Arosa, 스위스',
    hashtags: ['스위스', '알프스', '가우시안스플래팅', '3D'],
    likesCount: 1234,
    commentsCount: 56,
    isLiked: false,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: '2',
    userId: '3',
    user: mockUsers[2],
    imageUrl: 'https://cdn-luma.com/76c1aafa17eb1377ff6cc9b8a246d58181a316bb0e33592dd1f657aaa0448ecd/Nebula_Gaussian_Splatting_thumb.jpg',
    is3D: false,
    caption: '2D 이미지도 공유할 수 있어요 💙 3D로 변환해보세요!',
    location: 'Digital Space',
    hashtags: ['디지털아트', '성운', '우주'],
    likesCount: 2345,
    commentsCount: 89,
    isLiked: true,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: '3',
    userId: '2',
    user: mockUsers[1],
    imageUrl: 'https://cdn-luma.com/dae39f9834ce5ff37efd798c27669caad8f67969a188f74a2e387607773b3fa9/MIT_WPU_Globe_thumb.jpg',
    image3dUrl: 'https://lumalabs.ai/capture/ca9ea966-ca24-4ec1-ab0f-af665cb546ff',
    is3D: true,
    caption: '지구본 아트 오브제! 디테일이 정말 놀라워요 🌍✨',
    location: 'MIT Campus',
    hashtags: ['아트', '오브제', '3D스캔', '가우시안스플래팅'],
    likesCount: 3456,
    commentsCount: 123,
    isLiked: false,
    createdAt: new Date(Date.now() - 10800000).toISOString(),
  },
  {
    id: '4',
    userId: '3',
    user: mockUsers[2],
    imageUrl: 'https://cdn-luma.com/998f66a10b35ecdc8ff532714eccd37ef567ba190b6b9a45833975e5b48fdf05/Dandelion_thumb.jpg',
    image3dUrl: 'https://lumalabs.ai/capture/d80d4876-cf71-4b8a-8b5b-49ffac44cd4a',
    is3D: true,
    caption: '민들레 홀씨의 섬세한 아름다움 🌼 매크로 3D 촬영',
    location: '정원',
    hashtags: ['자연', '매크로', '민들레', '3D촬영'],
    likesCount: 4567,
    commentsCount: 234,
    isLiked: true,
    createdAt: new Date(Date.now() - 14400000).toISOString(),
  },
  {
    id: '5',
    userId: '2',
    user: mockUsers[1],
    imageUrl: 'https://cdn-luma.com/77b06b20dd103ee39f6c8fb54768068ce4f043c8f1cc238d563abe7e5c7a4a84/Jules_Desbois_La_Femme_l_thumb.jpg',
    image3dUrl: 'https://lumalabs.ai/capture/1b5f3e33-3900-4398-8795-b585ae13fd2d',
    is3D: true,
    caption: '고전 조각 작품의 섬세한 표현 🗿 박물관 소장품을 3D로',
    location: '미술관',
    hashtags: ['조각', '예술', '박물관', '3D아카이빙'],
    likesCount: 5678,
    commentsCount: 345,
    isLiked: false,
    createdAt: new Date(Date.now() - 18000000).toISOString(),
  },
  {
    id: '6',
    userId: '3',
    user: mockUsers[2],
    imageUrl: 'https://cdn-luma.com/76c1aafa17eb1377ff6cc9b8a246d58181a316bb0e33592dd1f657aaa0448ecd/Nebula_Gaussian_Splatting_thumb.jpg',
    image3dUrl: 'https://lumalabs.ai/capture/b86b7928-f130-40a5-8cac-8095f30eed54',
    is3D: true,
    caption: '성운 가우시안 스플래팅 비주얼 ✨ 환상적인 우주 공간',
    location: 'Digital Art',
    hashtags: ['성운', '우주', '디지털아트', 'GaussianSplatting'],
    likesCount: 6789,
    commentsCount: 456,
    isLiked: false,
    createdAt: new Date(Date.now() - 21600000).toISOString(),
  },
  {
    id: '7',
    userId: '1',
    user: mockUsers[0],
    imageUrl: 'https://cdn-luma.com/c5464e01c904a033180b9f87ba7e61fe363ab854a8842a9f66dbb99cffc4dc95/Arosa_Hörnli_Switzerland_thumb.jpg',
    image3dUrl: 'https://lumalabs.ai/capture/4da7cf32-865a-4515-8cb9-9dfc574c90c2',
    is3D: true,
    caption: '알프스 산맥의 겨울 풍경 ❄️ 눈 덮인 산들의 장관',
    location: 'Arosa, 스위스',
    hashtags: ['스위스', '알프스', '설경', '겨울여행'],
    likesCount: 7890,
    commentsCount: 567,
    isLiked: false,
    createdAt: new Date(Date.now() - 25200000).toISOString(),
  },
  {
    id: '8',
    userId: '2',
    user: mockUsers[1],
    imageUrl: 'https://cdn-luma.com/dae39f9834ce5ff37efd798c27669caad8f67969a188f74a2e387607773b3fa9/MIT_WPU_Globe_thumb.jpg',
    image3dUrl: 'https://lumalabs.ai/capture/ca9ea966-ca24-4ec1-ab0f-af665cb546ff',
    is3D: true,
    caption: '빈티지 지구본 컬렉션 🌍 360도 회전해서 감상하세요',
    location: 'MIT Campus',
    hashtags: ['빈티지', '지구본', '인테리어', '컬렉션'],
    likesCount: 8901,
    commentsCount: 678,
    isLiked: true,
    createdAt: new Date(Date.now() - 28800000).toISOString(),
  },
];

// Travel 랜드마크 에셋 데이터
export interface TravelAsset {
  id: string;
  name: string;
  lat: number;
  lon: number;
  captureUrl: string;
}

export const travelAssets: TravelAsset[] = [
  { id: '1', name: 'Eiffel Tower', lat: 48.8584, lon: 2.2945, captureUrl: 'https://lumalabs.ai/capture/ca9ea966-ca24-4ec1-ab0f-af665cb546ff' },
  { id: '2', name: 'Statue of Liberty', lat: 40.6892, lon: -74.0445, captureUrl: 'https://lumalabs.ai/capture/e5b6d44c-43e1-4d1e-b2d5-eca9d334b3fa' },
  { id: '3', name: 'Seoul Tower', lat: 37.5512, lon: 126.9882, captureUrl: 'https://lumalabs.ai/capture/822bac8d-70c6-404e-aaae-f89f46672c67' },
  { id: '4', name: 'Tokyo Tower', lat: 35.6586, lon: 139.7454, captureUrl: 'https://lumalabs.ai/capture/9d9e1e45-b089-4e4b-bb7d-ebc2d8cc7f57' },
  { id: '5', name: 'Sydney Opera', lat: -33.8568, lon: 151.2153, captureUrl: 'https://lumalabs.ai/capture/9dfc3d2d-c6c4-40e6-b23c-c44f3f84af99' },
  { id: '6', name: 'Arosa Alps', lat: 46.7785, lon: 9.6764, captureUrl: 'https://lumalabs.ai/capture/4da7cf32-865a-4515-8cb9-9dfc574c90c2' },
  { id: '7', name: 'Big Ben', lat: 51.4994, lon: -0.1245, captureUrl: 'https://lumalabs.ai/capture/d80d4876-cf71-4b8a-8b5b-49ffac44cd4a' },
  { id: '8', name: 'Colosseum', lat: 41.8902, lon: 12.4922, captureUrl: 'https://lumalabs.ai/capture/1b5f3e33-3900-4398-8795-b585ae13fd2d' },
  { id: '9', name: 'Taj Mahal', lat: 27.1751, lon: 78.0421, captureUrl: 'https://lumalabs.ai/capture/b86b7928-f130-40a5-8cac-8095f30eed54' },
  { id: '10', name: 'Great Wall', lat: 40.4319, lon: 116.5704, captureUrl: 'https://lumalabs.ai/capture/4da7cf32-865a-4515-8cb9-9dfc574c90c2' },
  { id: '11', name: 'Machu Picchu', lat: -13.1631, lon: -72.5450, captureUrl: 'https://lumalabs.ai/capture/ca9ea966-ca24-4ec1-ab0f-af665cb546ff' },
  { id: '12', name: 'Christ Redeemer', lat: -22.9519, lon: -43.2105, captureUrl: 'https://lumalabs.ai/capture/e5b6d44c-43e1-4d1e-b2d5-eca9d334b3fa' },
  { id: '13', name: 'Golden Gate Bridge', lat: 37.8199, lon: -122.4783, captureUrl: 'https://lumalabs.ai/capture/822bac8d-70c6-404e-aaae-f89f46672c67' },
  { id: '14', name: 'Burj Khalifa', lat: 25.1972, lon: 55.2744, captureUrl: 'https://lumalabs.ai/capture/9d9e1e45-b089-4e4b-bb7d-ebc2d8cc7f57' },
  { id: '15', name: 'Angkor Wat', lat: 13.4125, lon: 103.8670, captureUrl: 'https://lumalabs.ai/capture/9dfc3d2d-c6c4-40e6-b23c-c44f3f84af99' },
  { id: '16', name: 'Petra', lat: 30.3285, lon: 35.4444, captureUrl: 'https://lumalabs.ai/capture/d80d4876-cf71-4b8a-8b5b-49ffac44cd4a' },
  { id: '17', name: 'Sagrada Familia', lat: 41.4036, lon: 2.1744, captureUrl: 'https://lumalabs.ai/capture/1b5f3e33-3900-4398-8795-b585ae13fd2d' },
  { id: '18', name: 'Acropolis', lat: 37.9715, lon: 23.7267, captureUrl: 'https://lumalabs.ai/capture/b86b7928-f130-40a5-8cac-8095f30eed54' },
  { id: '19', name: 'Stonehenge', lat: 51.1789, lon: -1.8262, captureUrl: 'https://lumalabs.ai/capture/4da7cf32-865a-4515-8cb9-9dfc574c90c2' },
  { id: '20', name: 'Mount Fuji', lat: 35.3606, lon: 138.7274, captureUrl: 'https://lumalabs.ai/capture/ca9ea966-ca24-4ec1-ab0f-af665cb546ff' },
];

// Travel 에셋을 Post 형태로 변환
export function convertTravelAssetsToPosts(): Post[] {
  // 각 에셋에 사용할 썸네일 이미지 배열 (다양한 Luma 썸네일 사용)
  const thumbnails = [
    'https://cdn-luma.com/c5464e01c904a033180b9f87ba7e61fe363ab854a8842a9f66dbb99cffc4dc95/Arosa_Hörnli_Switzerland_thumb.jpg',
    'https://cdn-luma.com/dae39f9834ce5ff37efd798c27669caad8f67969a188f74a2e387607773b3fa9/MIT_WPU_Globe_thumb.jpg',
    'https://cdn-luma.com/998f66a10b35ecdc8ff532714eccd37ef567ba190b6b9a45833975e5b48fdf05/Dandelion_thumb.jpg',
    'https://cdn-luma.com/77b06b20dd103ee39f6c8fb54768068ce4f043c8f1cc238d563abe7e5c7a4a84/Jules_Desbois_La_Femme_l_thumb.jpg',
    'https://cdn-luma.com/76c1aafa17eb1377ff6cc9b8a246d58181a316bb0e33592dd1f657aaa0448ecd/Nebula_Gaussian_Splatting_thumb.jpg',
  ];

  return travelAssets.map((asset, index) => ({
    id: `travel-${asset.id}`,
    userId: '2',
    user: mockUsers[1],
    imageUrl: thumbnails[index % thumbnails.length], // 썸네일을 순환하여 사용
    image3dUrl: asset.captureUrl,
    is3D: true,
    caption: `${asset.name}의 3D 뷰를 탐험해보세요! 🌍✨`,
    location: asset.name,
    hashtags: ['랜드마크', '여행', '3D', '가우시안스플래팅'],
    likesCount: Math.floor(Math.random() * 5000) + 1000,
    commentsCount: Math.floor(Math.random() * 200) + 10,
    isLiked: false,
    createdAt: new Date(Date.now() - (index * 3600000)).toISOString(),
    editMetadata: null,
  }));
}

// Luma 데이터셋 갤러리 (업로드 화면용)
export const lumaGalleryAssets = [
  {
    id: 'luma-1',
    name: 'Arosa Alps Switzerland',
    thumbnail: 'https://cdn-luma.com/c5464e01c904a033180b9f87ba7e61fe363ab854a8842a9f66dbb99cffc4dc95/Arosa_Hörnli_Switzerland_thumb.jpg',
    captureUrl: 'https://lumalabs.ai/capture/4da7cf32-865a-4515-8cb9-9dfc574c90c2',
  },
  {
    id: 'luma-2',
    name: 'MIT WPU Globe',
    thumbnail: 'https://cdn-luma.com/dae39f9834ce5ff37efd798c27669caad8f67969a188f74a2e387607773b3fa9/MIT_WPU_Globe_thumb.jpg',
    captureUrl: 'https://lumalabs.ai/capture/ca9ea966-ca24-4ec1-ab0f-af665cb546ff',
  },
  {
    id: 'luma-3',
    name: 'Dandelion Macro',
    thumbnail: 'https://cdn-luma.com/998f66a10b35ecdc8ff532714eccd37ef567ba190b6b9a45833975e5b48fdf05/Dandelion_thumb.jpg',
    captureUrl: 'https://lumalabs.ai/capture/d80d4876-cf71-4b8a-8b5b-49ffac44cd4a',
  },
  {
    id: 'luma-4',
    name: 'Jules Desbois Sculpture',
    thumbnail: 'https://cdn-luma.com/77b06b20dd103ee39f6c8fb54768068ce4f043c8f1cc238d563abe7e5c7a4a84/Jules_Desbois_La_Femme_l_thumb.jpg',
    captureUrl: 'https://lumalabs.ai/capture/1b5f3e33-3900-4398-8795-b585ae13fd2d',
  },
  {
    id: 'luma-5',
    name: 'Nebula Gaussian Splatting',
    thumbnail: 'https://cdn-luma.com/76c1aafa17eb1377ff6cc9b8a246d58181a316bb0e33592dd1f657aaa0448ecd/Nebula_Gaussian_Splatting_thumb.jpg',
    captureUrl: 'https://lumalabs.ai/capture/b86b7928-f130-40a5-8cac-8095f30eed54',
  },
];

// Mock 인증 응답 생성 함수
export function createMockAuthResponse(email: string, username: string) {
  return {
    user: {
      id: '1',
      email,
      username,
      profileImage: 'https://cdn-luma.com/c5464e01c904a033180b9f87ba7e61fe363ab854a8842a9f66dbb99cffc4dc95/Arosa_Hörnli_Switzerland_thumb.jpg',
      bio: '가우시안 스플래팅을 사랑하는 사람',
      followersCount: 0,
      followingCount: 0,
      postsCount: 0,
      createdAt: new Date().toISOString(),
    },
    token: 'mock_token_' + Date.now(),
  };
}

// 딜레이 시뮬레이션 (실제 API 호출처럼 보이게)
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
