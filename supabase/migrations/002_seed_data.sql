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
      'https://cdn-luma.com/c5464e01c904a033180b9f87ba7e61fe363ab854a8842a9f66dbb99cffc4dc95/Arosa_Hörnli_Switzerland_thumb.jpg',
      '가우시안 스플래팅으로 세상을 기록합니다 ✨',
      NOW()
    ),
    (
      mock_user_2_id,
      'worldexplorer',
      'worldexplorer@example.com',
      'https://cdn-luma.com/dae39f9834ce5ff37efd798c27669caad8f67969a188f74a2e387607773b3fa9/MIT_WPU_Globe_thumb.jpg',
      '🌍 3D로 여행을 공유하는 크리에이터',
      NOW()
    ),
    (
      mock_user_3_id,
      'photographer',
      'photographer@example.com',
      'https://cdn-luma.com/998f66a10b35ecdc8ff532714eccd37ef567ba190b6b9a45833975e5b48fdf05/Dandelion_thumb.jpg',
      '📸 가우시안 스플래팅 아티스트',
      NOW()
    )
  ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    email = EXCLUDED.email,
    profile_image = EXCLUDED.profile_image,
    bio = EXCLUDED.bio;

END $$;

-- Insert mock posts
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
  -- Post 1: Alps
  (
    '550e8400-e29b-41d4-a716-446655440011',
    '550e8400-e29b-41d4-a716-446655440002',
    'https://cdn-luma.com/c5464e01c904a033180b9f87ba7e61fe363ab854a8842a9f66dbb99cffc4dc95/Arosa_Hörnli_Switzerland_thumb.jpg',
    'https://lumalabs.ai/capture/4da7cf32-865a-4515-8cb9-9dfc574c90c2',
    true,
    '스위스 알프스의 아름다운 설경! 360도 파노라마로 즐겨보세요 🏔️✨',
    'Arosa, 스위스',
    ARRAY['스위스', '알프스', '가우시안스플래팅', '3D'],
    NOW() - INTERVAL '1 hour'
  ),
  -- Post 2: Nebula
  (
    '550e8400-e29b-41d4-a716-446655440012',
    '550e8400-e29b-41d4-a716-446655440003',
    'https://cdn-luma.com/76c1aafa17eb1377ff6cc9b8a246d58181a316bb0e33592dd1f657aaa0448ecd/Nebula_Gaussian_Splatting_thumb.jpg',
    'https://lumalabs.ai/capture/b86b7928-f130-40a5-8cac-8095f30eed54',
    true,
    '성운 가우시안 스플래팅 💙 환상적인 우주 공간을 3D로!',
    'Digital Space',
    ARRAY['디지털아트', '성운', '우주', '가우시안스플래팅'],
    NOW() - INTERVAL '2 hours'
  ),
  -- Post 3: Globe
  (
    '550e8400-e29b-41d4-a716-446655440013',
    '550e8400-e29b-41d4-a716-446655440002',
    'https://cdn-luma.com/dae39f9834ce5ff37efd798c27669caad8f67969a188f74a2e387607773b3fa9/MIT_WPU_Globe_thumb.jpg',
    'https://lumalabs.ai/capture/ca9ea966-ca24-4ec1-ab0f-af665cb546ff',
    true,
    '지구본 아트 오브제! 디테일이 정말 놀라워요 🌍✨',
    'MIT Campus',
    ARRAY['아트', '오브제', '3D스캔', '가우시안스플래팅'],
    NOW() - INTERVAL '3 hours'
  ),
  -- Post 4: Dandelion
  (
    '550e8400-e29b-41d4-a716-446655440014',
    '550e8400-e29b-41d4-a716-446655440003',
    'https://cdn-luma.com/998f66a10b35ecdc8ff532714eccd37ef567ba190b6b9a45833975e5b48fdf05/Dandelion_thumb.jpg',
    'https://lumalabs.ai/capture/d80d4876-cf71-4b8a-8b5b-49ffac44cd4a',
    true,
    '민들레 홀씨의 섬세한 아름다움 🌼 매크로 3D 촬영',
    '정원',
    ARRAY['자연', '매크로', '민들레', '3D촬영'],
    NOW() - INTERVAL '4 hours'
  ),
  -- Post 5: Sculpture
  (
    '550e8400-e29b-41d4-a716-446655440015',
    '550e8400-e29b-41d4-a716-446655440002',
    'https://cdn-luma.com/77b06b20dd103ee39f6c8fb54768068ce4f043c8f1cc238d563abe7e5c7a4a84/Jules_Desbois_La_Femme_l_thumb.jpg',
    'https://lumalabs.ai/capture/1b5f3e33-3900-4398-8795-b585ae13fd2d',
    true,
    '고전 조각 작품의 섬세한 표현 🗿 박물관 소장품을 3D로',
    '미술관',
    ARRAY['조각', '예술', '박물관', '3D아카이빙'],
    NOW() - INTERVAL '5 hours'
  ),
  -- Post 6: Nebula again
  (
    '550e8400-e29b-41d4-a716-446655440016',
    '550e8400-e29b-41d4-a716-446655440003',
    'https://cdn-luma.com/76c1aafa17eb1377ff6cc9b8a246d58181a316bb0e33592dd1f657aaa0448ecd/Nebula_Gaussian_Splatting_thumb.jpg',
    'https://lumalabs.ai/capture/b86b7928-f130-40a5-8cac-8095f30eed54',
    true,
    '성운 가우시안 스플래팅 비주얼 ✨ 환상적인 우주 공간',
    'Digital Art',
    ARRAY['성운', '우주', '디지털아트', 'GaussianSplatting'],
    NOW() - INTERVAL '6 hours'
  ),
  -- Post 7: Alps winter
  (
    '550e8400-e29b-41d4-a716-446655440017',
    '550e8400-e29b-41d4-a716-446655440001',
    'https://cdn-luma.com/c5464e01c904a033180b9f87ba7e61fe363ab854a8842a9f66dbb99cffc4dc95/Arosa_Hörnli_Switzerland_thumb.jpg',
    'https://lumalabs.ai/capture/4da7cf32-865a-4515-8cb9-9dfc574c90c2',
    true,
    '알프스 산맥의 겨울 풍경 ❄️ 눈 덮인 산들의 장관',
    'Arosa, 스위스',
    ARRAY['스위스', '알프스', '설경', '겨울여행'],
    NOW() - INTERVAL '7 hours'
  ),
  -- Post 8: Globe vintage
  (
    '550e8400-e29b-41d4-a716-446655440018',
    '550e8400-e29b-41d4-a716-446655440002',
    'https://cdn-luma.com/dae39f9834ce5ff37efd798c27669caad8f67969a188f74a2e387607773b3fa9/MIT_WPU_Globe_thumb.jpg',
    'https://lumalabs.ai/capture/ca9ea966-ca24-4ec1-ab0f-af665cb546ff',
    true,
    '빈티지 지구본 컬렉션 🌍 360도 회전해서 감상하세요',
    'MIT Campus',
    ARRAY['빈티지', '지구본', '인테리어', '컬렉션'],
    NOW() - INTERVAL '8 hours'
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
  ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440014')
ON CONFLICT (user_id, post_id) DO NOTHING;

-- Add some initial comments
INSERT INTO comments (user_id, post_id, text)
VALUES
  ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440011', '정말 아름다운 풍경이네요! 🏔️'),
  ('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440011', '가우시안 스플래팅 퀄리티가 정말 좋아요'),
  ('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440012', '우주 테마 너무 좋습니다! ✨'),
  ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440013', '지구본 디테일이 대박이에요');

-- Update profile stats to match the posts/likes/comments we just created
UPDATE profiles SET
  posts_count = (SELECT COUNT(*) FROM posts WHERE user_id = profiles.id),
  followers_count = FLOOR(RANDOM() * 5000 + 1000),
  following_count = FLOOR(RANDOM() * 1000 + 100);
