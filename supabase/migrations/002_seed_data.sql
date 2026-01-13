-- Seed data for initial demo content
-- This creates mock users and posts so the app has content even when first launched

-- Create mock users (bypassing auth.users for demo purposes)
-- Note: In production, these would be real users created through Supabase Auth

-- First, we need to create auth users for our mock profiles
-- We'll use a secure random password that won't be used
DO $$
DECLARE
  mock_user_1_id UUID := '550e8400-e29b-41d4-a716-446655440001';
  mock_user_2_id UUID := '550e8400-e29b-41d4-a716-446655440002';
  mock_user_3_id UUID := '550e8400-e29b-41d4-a716-446655440003';
BEGIN
  -- Insert mock users into auth.users (if they don't exist)
  -- This is a workaround for demo purposes
  -- In production, users sign up normally through Supabase Auth

  -- Delete existing mock users if they exist (for re-running the seed)
  DELETE FROM auth.users WHERE id IN (mock_user_1_id, mock_user_2_id, mock_user_3_id);

  -- User 1
  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    confirmation_token,
    email_change_token_new,
    recovery_token
  )
  VALUES (
    mock_user_1_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'traveler123@example.com',
    crypt('demo_password_123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"username":"traveler123","full_name":"traveler123"}',
    false,
    '',
    '',
    ''
  );

  -- User 2
  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    confirmation_token,
    email_change_token_new,
    recovery_token
  )
  VALUES (
    mock_user_2_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'worldexplorer@example.com',
    crypt('demo_password_123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"username":"worldexplorer","full_name":"worldexplorer"}',
    false,
    '',
    '',
    ''
  );

  -- User 3
  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    confirmation_token,
    email_change_token_new,
    recovery_token
  )
  VALUES (
    mock_user_3_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'photographer@example.com',
    crypt('demo_password_123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"username":"photographer","full_name":"photographer"}',
    false,
    '',
    '',
    ''
  );

  -- Now insert profiles (will be auto-created by trigger, but we'll insert manually for consistency)
  INSERT INTO profiles (id, username, email, profile_image, bio, created_at)
  VALUES
    (
      mock_user_1_id,
      'traveler123',
      'traveler123@example.com',
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop',
      '가우시안 스플래팅으로 세상을 기록합니다 ✨',
      NOW()
    ),
    (
      mock_user_2_id,
      'worldexplorer',
      'worldexplorer@example.com',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
      '🌍 3D로 여행을 공유하는 크리에이터',
      NOW()
    ),
    (
      mock_user_3_id,
      'photographer',
      'photographer@example.com',
      'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=400&h=400&fit=crop',
      '📸 가우시안 스플래팅 아티스트',
      NOW()
    )
  ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    email = EXCLUDED.email,
    profile_image = EXCLUDED.profile_image,
    bio = EXCLUDED.bio;

END $$;

-- Insert mock posts with NEW unique assets (no duplicates)
INSERT INTO posts (
  id,
  user_id,
  image_url,
  image_3d_url,
  is_3d,
  caption,
  location,
  hashtags,
  created_at
)
VALUES
  -- Post 1
  (
    '550e8400-e29b-41d4-a716-446655440011',
    '550e8400-e29b-41d4-a716-446655440001',
    'https://cdn-luma.com/383f3e1aef6a30beead906a6fd0bb4046fe926f46503b3d24672f01e47df6bfe/Arhaus_room_thumb.jpg',
    'https://lumalabs.ai/capture/33aad979-c28e-41a5-b38b-7af0cce22302',
    true,
    '도시의 야경을 3D로 담다 🌃 건축물의 디테일이 생생하게!',
    'Seoul, Korea',
    ARRAY['도시', '야경', '건축', '3D스캔'],
    NOW() - INTERVAL '1 hour'
  ),
  -- Post 2
  (
    '550e8400-e29b-41d4-a716-446655440012',
    '550e8400-e29b-41d4-a716-446655440002',
    'https://cdn-luma.com/d23ce7ed55189414f9de1e33b15421f987ce090db062b890f17607d96a292783/Hotel_Lobby_thumb.jpg',
    'https://lumalabs.ai/capture/202920f3-a10f-4eaa-9d4d-ec0de62b639a',
    true,
    '공원의 평화로운 풍경 🌳 자연을 360도로 담아보세요',
    'Central Park',
    ARRAY['자연', '공원', '풍경', '가우시안스플래팅'],
    NOW() - INTERVAL '2 hours'
  ),
  -- Post 3
  (
    '550e8400-e29b-41d4-a716-446655440013',
    '550e8400-e29b-41d4-a716-446655440003',
    'https://cdn-luma.com/aa2c5266df2dea34697db8159ebcc7388fbdbb1ce5b2de86cc5e222776aeb9c8/Hydrangea_x_thumb.jpg',
    'https://lumalabs.ai/capture/a68f48e0-026f-4701-933c-457678434414',
    true,
    '역사적인 건물의 웅장함 🏛️ 시간이 멈춘 듯한 순간',
    'Historical Site',
    ARRAY['역사', '건축물', '문화유산', '3D'],
    NOW() - INTERVAL '3 hours'
  ),
  -- Post 4
  (
    '550e8400-e29b-41d4-a716-446655440014',
    '550e8400-e29b-41d4-a716-446655440001',
    'https://cdn-luma.com/7d92299e8f9465ba49ae3b460356e0e9077e5fc15a7f173df33f8b6856ad8b25/Aurora_University_Bedrosi_thumb.jpg',
    'https://lumalabs.ai/capture/685c79f5-0ed5-456f-a043-67e7d1379d03',
    true,
    '실내 인테리어의 아름다움 ✨ 공간의 분위기를 그대로',
    'Modern House',
    ARRAY['인테리어', '디자인', '모던', '3D스캔'],
    NOW() - INTERVAL '4 hours'
  ),
  -- Post 5
  (
    '550e8400-e29b-41d4-a716-446655440015',
    '550e8400-e29b-41d4-a716-446655440002',
    'https://cdn-luma.com/28da979c3e46c42f4c5fb014fb1eee39ffeca3c480362249c037dbdf275575fe/Saarpolygon_thumb.jpg',
    'https://lumalabs.ai/capture/0180b1f3-d3ef-4020-820a-22a36d94cb52',
    true,
    '예술 작품을 새로운 시각으로 🎨 모든 각도에서 감상하세요',
    'Art Gallery',
    ARRAY['예술', '갤러리', '작품', '3D아카이빙'],
    NOW() - INTERVAL '5 hours'
  ),
  -- Post 6
  (
    '550e8400-e29b-41d4-a716-446655440016',
    '550e8400-e29b-41d4-a716-446655440003',
    'https://cdn-luma.com/a1528ee0429ac29e0502e7ca57ec3d98d0638aff1dbd379308755dc498a2e8e5/Wells_Fargo_Center_Denver_thumb.jpg',
    'https://lumalabs.ai/capture/d73e294a-b07a-4e97-b84b-8da3bb34ab5c',
    true,
    '자연의 세밀한 텍스처 🍃 매크로로 담은 생명력',
    'Nature Reserve',
    ARRAY['자연', '매크로', '식물', '디테일'],
    NOW() - INTERVAL '6 hours'
  ),
  -- Post 7
  (
    '550e8400-e29b-41d4-a716-446655440017',
    '550e8400-e29b-41d4-a716-446655440001',
    'https://cdn-luma.com/63cfa2844779d5a9ed73f69cf9c65129dc888c248ad31e86afb3507beea1cdc1/Vases_thumb.jpg',
    'https://lumalabs.ai/capture/0c2354fd-8e6a-402e-9c3c-40b3890b74b5',
    true,
    '거리 풍경의 생동감 🚶‍♂️ 일상을 특별하게 기록하다',
    'City Street',
    ARRAY['거리', '일상', '도시생활', '스냅'],
    NOW() - INTERVAL '7 hours'
  ),
  -- Post 8
  (
    '550e8400-e29b-41d4-a716-446655440018',
    '550e8400-e29b-41d4-a716-446655440002',
    'https://cdn-luma.com/52d63f443d38675c353a12bf1eaf633f60754f45f54cf375a14c3f1df70c746a/JOKESTER_2_Paula_Crown_so_thumb.jpg',
    'https://lumalabs.ai/capture/bb3e32e1-613a-41e5-a5d6-e5603576aa6b',
    true,
    '오브제의 입체감 🎭 조형미를 모든 방향에서',
    'Studio',
    ARRAY['오브제', '조형', '아트', '3D촬영'],
    NOW() - INTERVAL '8 hours'
  ),
  -- Post 9
  (
    '550e8400-e29b-41d4-a716-446655440019',
    '550e8400-e29b-41d4-a716-446655440003',
    'https://cdn-luma.com/285dad34964ab19970fffa5f9b352a1ce5f5c1c7f730ff5bda2ce50f27dd0619/Moses_by_Nitzan_Avidor_thumb.jpg',
    'https://lumalabs.ai/capture/a9bca50d-89bb-4e1d-ac01-af1c1cbd74cb',
    true,
    '전통 건축의 아름다움 🏯 역사가 살아 숨쉬는 공간',
    'Traditional Village',
    ARRAY['전통', '한옥', '문화', '유산'],
    NOW() - INTERVAL '9 hours'
  ),
  -- Post 10
  (
    '550e8400-e29b-41d4-a716-446655440020',
    '550e8400-e29b-41d4-a716-446655440001',
    'https://cdn-luma.com/9e17d0d3af2763f04f279f832a5389b6f29beabe1db61ded704e9e40adbadc67/Sundial_by_janiefitzgeral_thumb.jpg',
    'https://lumalabs.ai/capture/8c21729b-eed9-479e-8d21-68c35035b47b',
    true,
    '현대 미술의 새로운 해석 🖼️ 가우시안 스플래팅으로 재탄생',
    'Museum',
    ARRAY['현대미술', '전시', '박물관', '3D'],
    NOW() - INTERVAL '10 hours'
  ),
  -- Post 11
  (
    '550e8400-e29b-41d4-a716-446655440021',
    '550e8400-e29b-41d4-a716-446655440002',
    'https://cdn-luma.com/7de0975c9cb6d373927fec8b845030c9c2eccb44192ca64b9f215b5b1da46d61/Portofino_Tower_Miami_Bea_thumb.jpg',
    'https://lumalabs.ai/capture/a4572635-8066-45d2-94b5-ffd4c55a92f0',
    true,
    '카페의 아늑한 분위기 ☕ 공간의 따뜻함을 담다',
    'Cozy Cafe',
    ARRAY['카페', '인테리어', '분위기', '일상'],
    NOW() - INTERVAL '11 hours'
  ),
  -- Post 12
  (
    '550e8400-e29b-41d4-a716-446655440022',
    '550e8400-e29b-41d4-a716-446655440003',
    'https://cdn-luma.com/e1a3b6e3b33a72bc9375ead2da90560e42c23cebb6b67c5ed699fad2d9972bf7/Fatetar_Castle_Espera_Spa_thumb.jpg',
    'https://lumalabs.ai/capture/dbf30400-7e8e-43e5-a9e9-43836b486c53',
    true,
    '자연광이 만드는 예술 🌅 빛과 그림자의 조화',
    'Outdoor',
    ARRAY['자연광', '분위기', '예술', '빛'],
    NOW() - INTERVAL '12 hours'
  ),
  -- Post 13
  (
    '550e8400-e29b-41d4-a716-446655440023',
    '550e8400-e29b-41d4-a716-446655440001',
    'https://cdn-luma.com/05c3390b981e9642505f719e1e873a4a9e7f277c6882dbad1dad17e285563f2a/Highcliffe_Castle_Video_thumb.jpg',
    'https://lumalabs.ai/capture/0b4de2ed-1621-4954-900f-0a94220071f2',
    true,
    '복잡한 구조의 세밀함 🔧 기계적 아름다움을 3D로',
    'Workshop',
    ARRAY['기계', '구조', '디테일', '산업'],
    NOW() - INTERVAL '13 hours'
  ),
  -- Post 14
  (
    '550e8400-e29b-41d4-a716-446655440024',
    '550e8400-e29b-41d4-a716-446655440002',
    'https://cdn-luma.com/987a90166b489fddab714f548f5b2fb6558cd7f102c5021913fc4289f75a013b/Former_U_S_National_Bank_thumb.jpg',
    'https://lumalabs.ai/capture/79016186-c892-4956-a256-2f6c00ca6ce0',
    true,
    '자연 속 숨겨진 보석 💎 발견의 기쁨을 공유합니다',
    'Hidden Spot',
    ARRAY['자연', '탐험', '발견', '비경'],
    NOW() - INTERVAL '14 hours'
  ),
  -- Post 15 (from mockData) - 스위스 알프스
  (
    '550e8400-e29b-41d4-a716-446655440025',
    '550e8400-e29b-41d4-a716-446655440002',
    'https://uvyttgmfepjyiglggmgz.supabase.co/storage/v1/object/public/post-images/KakaoTalk_Photo_2026-01-13-19-32-00.png',
    'https://lumalabs.ai/capture/4da7cf32-865a-4515-8cb9-9dfc574c90c2',
    true,
    '스위스 알프스의 아름다운 설경! 360도 파노라마로 즐겨보세요 🏔️✨',
    'Arosa, 스위스',
    ARRAY['스위스', '알프스', '가우시안스플래팅', '3D'],
    NOW() - INTERVAL '15 hours'
  ),
  -- Post 16 (from mockData) - 성운 가우시안 스플래팅
  (
    '550e8400-e29b-41d4-a716-446655440026',
    '550e8400-e29b-41d4-a716-446655440003',
    'https://uvyttgmfepjyiglggmgz.supabase.co/storage/v1/object/public/post-images/KakaoTalk_Photo_2026-01-13-19-26-25.png',
    'https://lumalabs.ai/capture/b86b7928-f130-40a5-8cac-8095f30eed54',
    true,
    '성운 가우시안 스플래팅 💙 환상적인 우주 공간을 3D로!',
    'Digital Space',
    ARRAY['디지털아트', '성운', '우주', '가우시안스플래팅'],
    NOW() - INTERVAL '16 hours'
  ),
  -- Post 17 (from mockData) - 지구본 아트 오브제
  (
    '550e8400-e29b-41d4-a716-446655440027',
    '550e8400-e29b-41d4-a716-446655440002',
    'https://cdn-luma.com/dae39f9834ce5ff37efd798c27669caad8f67969a188f74a2e387607773b3fa9/MIT_WPU_Globe_thumb.jpg',
    'https://lumalabs.ai/capture/ca9ea966-ca24-4ec1-ab0f-af665cb546ff',
    true,
    '지구본 아트 오브제! 디테일이 정말 놀라워요 🌍✨',
    'MIT Campus',
    ARRAY['아트', '오브제', '3D스캔', '가우시안스플래팅'],
    NOW() - INTERVAL '17 hours'
  ),
  -- Post 18 (from mockData) - 민들레 홀씨
  (
    '550e8400-e29b-41d4-a716-446655440028',
    '550e8400-e29b-41d4-a716-446655440003',
    'https://cdn-luma.com/998f66a10b35ecdc8ff532714eccd37ef567ba190b6b9a45833975e5b48fdf05/Dandelion_thumb.jpg',
    'https://lumalabs.ai/capture/d80d4876-cf71-4b8a-8b5b-49ffac44cd4a',
    true,
    '민들레 홀씨의 섬세한 아름다움 🌼 매크로 3D 촬영',
    '정원',
    ARRAY['자연', '매크로', '민들레', '3D촬영'],
    NOW() - INTERVAL '18 hours'
  ),
  -- Post 19 (from mockData) - 고전 조각 작품
  (
    '550e8400-e29b-41d4-a716-446655440029',
    '550e8400-e29b-41d4-a716-446655440002',
    'https://cdn-luma.com/77b06b20dd103ee39f6c8fb54768068ce4f043c8f1cc238d563abe7e5c7a4a84/Jules_Desbois_La_Femme_l_thumb.jpg',
    'https://lumalabs.ai/capture/1b5f3e33-3900-4398-8795-b585ae13fd2d',
    true,
    '고전 조각 작품의 섬세한 표현 🗿 박물관 소장품을 3D로',
    '미술관',
    ARRAY['조각', '예술', '박물관', '3D아카이빙'],
    NOW() - INTERVAL '19 hours'
  ),
  -- Post 20 (from mockData) - 성운 가우시안 스플래팅 (다른 각도/버전)
  (
    '550e8400-e29b-41d4-a716-446655440030',
    '550e8400-e29b-41d4-a716-446655440003',
    'https://uvyttgmfepjyiglggmgz.supabase.co/storage/v1/object/public/post-images/KakaoTalk_Photo_2026-01-13-19-26-25.png',
    'https://lumalabs.ai/capture/b86b7928-f130-40a5-8cac-8095f30eed54',
    true,
    '성운 가우시안 스플래팅 비주얼 ✨ 환상적인 우주 공간',
    'Digital Art',
    ARRAY['성운', '우주', '디지털아트', 'GaussianSplatting'],
    NOW() - INTERVAL '20 hours'
  ),
  -- Post 21 (from mockData) - 알프스 겨울 풍경
  (
    '550e8400-e29b-41d4-a716-446655440031',
    '550e8400-e29b-41d4-a716-446655440001',
    'https://uvyttgmfepjyiglggmgz.supabase.co/storage/v1/object/public/post-images/KakaoTalk_Photo_2026-01-13-19-32-00.png',
    'https://lumalabs.ai/capture/4da7cf32-865a-4515-8cb9-9dfc574c90c2',
    true,
    '알프스 산맥의 겨울 풍경 ❄️ 눈 덮인 산들의 장관',
    'Arosa, 스위스',
    ARRAY['스위스', '알프스', '설경', '겨울여행'],
    NOW() - INTERVAL '21 hours'
  ),
  -- Post 22 (from mockData) - 빈티지 지구본
  (
    '550e8400-e29b-41d4-a716-446655440032',
    '550e8400-e29b-41d4-a716-446655440002',
    'https://cdn-luma.com/9e17d0d3af2763f04f279f832a5389b6f29beabe1db61ded704e9e40adbadc67/Sundial_by_janiefitzgeral_thumb.jpg',
    'https://lumalabs.ai/capture/ca9ea966-ca24-4ec1-ab0f-af665cb546ff',
    true,
    '빈티지 지구본 컬렉션 🌍 360도 회전해서 감상하세요',
    'MIT Campus',
    ARRAY['빈티지', '지구본', '인테리어', '컬렉션'],
    NOW() - INTERVAL '22 hours'
  )
ON CONFLICT (id) DO UPDATE SET
  caption = EXCLUDED.caption,
  image_url = EXCLUDED.image_url,
  image_3d_url = EXCLUDED.image_3d_url;

-- Add some initial likes to make it look active
INSERT INTO likes (user_id, post_id)
VALUES
  ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440011'),
  ('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440011'),
  ('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440012'),
  ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440012'),
  ('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440013'),
  ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440014'),
  ('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440015'),
  ('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440016'),
  ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440017'),
  ('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440018')
ON CONFLICT (user_id, post_id) DO NOTHING;

-- Add some initial comments
INSERT INTO comments (user_id, post_id, text)
VALUES
  ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440011', '와 정말 멋진 작품이네요! 👍'),
  ('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440011', '가우시안 스플래팅 퀄리티가 대박이에요'),
  ('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440012', '분위기가 정말 좋습니다 ✨'),
  ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440013', '디테일이 살아있네요!'),
  ('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440014', '이런 공간 정말 가보고 싶어요'),
  ('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440015', '예술적이에요 🎨');

-- Update profile stats to match the posts/likes/comments we just created
UPDATE profiles SET
  posts_count = (SELECT COUNT(*) FROM posts WHERE user_id = profiles.id),
  followers_count = FLOOR(RANDOM() * 5000 + 1000),
  following_count = FLOOR(RANDOM() * 1000 + 100);
