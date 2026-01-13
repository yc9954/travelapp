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
      'Recording the world with Gaussian Splatting ✨',
      NOW()
    ),
    (
      mock_user_2_id,
      'worldexplorer',
      'worldexplorer@example.com',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
      '🌍 Creator sharing travels in 3D',
      NOW()
    ),
    (
      mock_user_3_id,
      'photographer',
      'photographer@example.com',
      'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=400&h=400&fit=crop',
      '📸 Gaussian Splatting Artist',
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
    'Capturing the city nightscape in 3D 🌃 The architectural details are so vivid!',
    'Seoul, Korea',
    ARRAY['city', 'nightscape', 'architecture', '3Dscan'],
    NOW() - INTERVAL '1 hour'
  ),
  -- Post 2
  (
    '550e8400-e29b-41d4-a716-446655440012',
    '550e8400-e29b-41d4-a716-446655440002',
    'https://cdn-luma.com/d23ce7ed55189414f9de1e33b15421f987ce090db062b890f17607d96a292783/Hotel_Lobby_thumb.jpg',
    'https://lumalabs.ai/capture/202920f3-a10f-4eaa-9d4d-ec0de62b639a',
    true,
    'Peaceful park scenery 🌳 Capture nature in 360 degrees',
    'Central Park',
    ARRAY['nature', 'park', 'landscape', 'GaussianSplatting'],
    NOW() - INTERVAL '2 hours'
  ),
  -- Post 3
  (
    '550e8400-e29b-41d4-a716-446655440013',
    '550e8400-e29b-41d4-a716-446655440003',
    'https://cdn-luma.com/aa2c5266df2dea34697db8159ebcc7388fbdbb1ce5b2de86cc5e222776aeb9c8/Hydrangea_x_thumb.jpg',
    'https://lumalabs.ai/capture/a68f48e0-026f-4701-933c-457678434414',
    true,
    'The grandeur of historic buildings 🏛️ A moment frozen in time',
    'Historical Site',
    ARRAY['history', 'architecture', 'heritage', '3D'],
    NOW() - INTERVAL '3 hours'
  ),
  -- Post 4
  (
    '550e8400-e29b-41d4-a716-446655440014',
    '550e8400-e29b-41d4-a716-446655440001',
    'https://cdn-luma.com/7d92299e8f9465ba49ae3b460356e0e9077e5fc15a7f173df33f8b6856ad8b25/Aurora_University_Bedrosi_thumb.jpg',
    'https://lumalabs.ai/capture/685c79f5-0ed5-456f-a043-67e7d1379d03',
    true,
    'The beauty of interior design ✨ Capturing the atmosphere of the space',
    'Modern House',
    ARRAY['interior', 'design', 'modern', '3Dscan'],
    NOW() - INTERVAL '4 hours'
  ),
  -- Post 5
  (
    '550e8400-e29b-41d4-a716-446655440015',
    '550e8400-e29b-41d4-a716-446655440002',
    'https://cdn-luma.com/28da979c3e46c42f4c5fb014fb1eee39ffeca3c480362249c037dbdf275575fe/Saarpolygon_thumb.jpg',
    'https://lumalabs.ai/capture/0180b1f3-d3ef-4020-820a-22a36d94cb52',
    true,
    'Artworks from a new perspective 🎨 Enjoy from every angle',
    'Art Gallery',
    ARRAY['art', 'gallery', 'artwork', '3Darchiving'],
    NOW() - INTERVAL '5 hours'
  ),
  -- Post 6
  (
    '550e8400-e29b-41d4-a716-446655440016',
    '550e8400-e29b-41d4-a716-446655440003',
    'https://cdn-luma.com/a1528ee0429ac29e0502e7ca57ec3d98d0638aff1dbd379308755dc498a2e8e5/Wells_Fargo_Center_Denver_thumb.jpg',
    'https://lumalabs.ai/capture/d73e294a-b07a-4e97-b84b-8da3bb34ab5c',
    true,
    'The intricate textures of nature 🍃 Capturing life through macro',
    'Nature Reserve',
    ARRAY['nature', 'macro', 'plant', 'detail'],
    NOW() - INTERVAL '6 hours'
  ),
  -- Post 7
  (
    '550e8400-e29b-41d4-a716-446655440017',
    '550e8400-e29b-41d4-a716-446655440001',
    'https://cdn-luma.com/63cfa2844779d5a9ed73f69cf9c65129dc888c248ad31e86afb3507beea1cdc1/Vases_thumb.jpg',
    'https://lumalabs.ai/capture/0c2354fd-8e6a-402e-9c3c-40b3890b74b5',
    true,
    'The vibrancy of street scenes 🚶‍♂️ Recording everyday life in a special way',
    'City Street',
    ARRAY['street', 'daily', 'citylife', 'snap'],
    NOW() - INTERVAL '7 hours'
  ),
  -- Post 8
  (
    '550e8400-e29b-41d4-a716-446655440018',
    '550e8400-e29b-41d4-a716-446655440002',
    'https://cdn-luma.com/52d63f443d38675c353a12bf1eaf633f60754f45f54cf375a14c3f1df70c746a/JOKESTER_2_Paula_Crown_so_thumb.jpg',
    'https://lumalabs.ai/capture/bb3e32e1-613a-41e5-a5d6-e5603576aa6b',
    true,
    'The three-dimensional quality of objects 🎭 Sculptural beauty from every direction',
    'Studio',
    ARRAY['object', 'sculpture', 'art', '3Dcapture'],
    NOW() - INTERVAL '8 hours'
  ),
  -- Post 9
  (
    '550e8400-e29b-41d4-a716-446655440019',
    '550e8400-e29b-41d4-a716-446655440003',
    'https://cdn-luma.com/285dad34964ab19970fffa5f9b352a1ce5f5c1c7f730ff5bda2ce50f27dd0619/Moses_by_Nitzan_Avidor_thumb.jpg',
    'https://lumalabs.ai/capture/a9bca50d-89bb-4e1d-ac01-af1c1cbd74cb',
    true,
    'The beauty of traditional architecture 🏯 A space where history comes alive',
    'Traditional Village',
    ARRAY['traditional', 'heritage', 'culture', 'legacy'],
    NOW() - INTERVAL '9 hours'
  ),
  -- Post 10
  (
    '550e8400-e29b-41d4-a716-446655440020',
    '550e8400-e29b-41d4-a716-446655440001',
    'https://cdn-luma.com/9e17d0d3af2763f04f279f832a5389b6f29beabe1db61ded704e9e40adbadc67/Sundial_by_janiefitzgeral_thumb.jpg',
    'https://lumalabs.ai/capture/8c21729b-eed9-479e-8d21-68c35035b47b',
    true,
    'A new interpretation of modern art 🖼️ Reborn with Gaussian Splatting',
    'Museum',
    ARRAY['contemporary', 'exhibition', 'museum', '3D'],
    NOW() - INTERVAL '10 hours'
  ),
  -- Post 11
  (
    '550e8400-e29b-41d4-a716-446655440021',
    '550e8400-e29b-41d4-a716-446655440002',
    'https://cdn-luma.com/7de0975c9cb6d373927fec8b845030c9c2eccb44192ca64b9f215b5b1da46d61/Portofino_Tower_Miami_Bea_thumb.jpg',
    'https://lumalabs.ai/capture/a4572635-8066-45d2-94b5-ffd4c55a92f0',
    true,
    'The cozy atmosphere of a cafe ☕ Capturing the warmth of the space',
    'Cozy Cafe',
    ARRAY['cafe', 'interior', 'atmosphere', 'daily'],
    NOW() - INTERVAL '11 hours'
  ),
  -- Post 12
  (
    '550e8400-e29b-41d4-a716-446655440022',
    '550e8400-e29b-41d4-a716-446655440003',
    'https://cdn-luma.com/e1a3b6e3b33a72bc9375ead2da90560e42c23cebb6b67c5ed699fad2d9972bf7/Fatetar_Castle_Espera_Spa_thumb.jpg',
    'https://lumalabs.ai/capture/dbf30400-7e8e-43e5-a9e9-43836b486c53',
    true,
    'Art created by natural light 🌅 The harmony of light and shadow',
    'Outdoor',
    ARRAY['natural', 'atmosphere', 'art', 'light'],
    NOW() - INTERVAL '12 hours'
  ),
  -- Post 13
  (
    '550e8400-e29b-41d4-a716-446655440023',
    '550e8400-e29b-41d4-a716-446655440001',
    'https://cdn-luma.com/05c3390b981e9642505f719e1e873a4a9e7f277c6882dbad1dad17e285563f2a/Highcliffe_Castle_Video_thumb.jpg',
    'https://lumalabs.ai/capture/0b4de2ed-1621-4954-900f-0a94220071f2',
    true,
    'The intricacy of complex structures 🔧 Mechanical beauty in 3D',
    'Workshop',
    ARRAY['machine', 'structure', 'detail', 'industrial'],
    NOW() - INTERVAL '13 hours'
  ),
  -- Post 14
  (
    '550e8400-e29b-41d4-a716-446655440024',
    '550e8400-e29b-41d4-a716-446655440002',
    'https://cdn-luma.com/987a90166b489fddab714f548f5b2fb6558cd7f102c5021913fc4289f75a013b/Former_U_S_National_Bank_thumb.jpg',
    'https://lumalabs.ai/capture/79016186-c892-4956-a256-2f6c00ca6ce0',
    true,
    'Hidden gems in nature 💎 Sharing the joy of discovery',
    'Hidden Spot',
    ARRAY['nature', 'exploration', 'discovery', 'scenic'],
    NOW() - INTERVAL '14 hours'
  ),
  -- Post 15 (from mockData) - Swiss Alps
  (
    '550e8400-e29b-41d4-a716-446655440025',
    '550e8400-e29b-41d4-a716-446655440002',
    'https://uvyttgmfepjyiglggmgz.supabase.co/storage/v1/object/public/post-images/KakaoTalk_Photo_2026-01-13-19-32-00.png',
    'https://lumalabs.ai/capture/4da7cf32-865a-4515-8cb9-9dfc574c90c2',
    true,
    'Beautiful winter scenery of the Swiss Alps! Enjoy in 360-degree panorama 🏔️✨',
    'Arosa, Switzerland',
    ARRAY['Switzerland', 'Alps', 'GaussianSplatting', '3D'],
    NOW() - INTERVAL '15 hours'
  ),
  -- Post 16 (from mockData) - Nebula Gaussian Splatting
  (
    '550e8400-e29b-41d4-a716-446655440026',
    '550e8400-e29b-41d4-a716-446655440003',
    'https://uvyttgmfepjyiglggmgz.supabase.co/storage/v1/object/public/post-images/KakaoTalk_Photo_2026-01-13-19-26-25.png',
    'https://lumalabs.ai/capture/b86b7928-f130-40a5-8cac-8095f30eed54',
    true,
    'Nebula Gaussian Splatting 💙 Fantastic cosmic space in 3D!',
    'Digital Space',
    ARRAY['digitalart', 'nebula', 'space', 'GaussianSplatting'],
    NOW() - INTERVAL '16 hours'
  ),
  -- Post 17 (from mockData) - Globe Art Object
  (
    '550e8400-e29b-41d4-a716-446655440027',
    '550e8400-e29b-41d4-a716-446655440002',
    'https://cdn-luma.com/dae39f9834ce5ff37efd798c27669caad8f67969a188f74a2e387607773b3fa9/MIT_WPU_Globe_thumb.jpg',
    'https://lumalabs.ai/capture/ca9ea966-ca24-4ec1-ab0f-af665cb546ff',
    true,
    'Globe art object! The details are truly amazing 🌍✨',
    'MIT Campus',
    ARRAY['art', 'object', '3Dscan', 'GaussianSplatting'],
    NOW() - INTERVAL '17 hours'
  ),
  -- Post 18 (from mockData) - Dandelion Seeds
  (
    '550e8400-e29b-41d4-a716-446655440028',
    '550e8400-e29b-41d4-a716-446655440003',
    'https://cdn-luma.com/998f66a10b35ecdc8ff532714eccd37ef567ba190b6b9a45833975e5b48fdf05/Dandelion_thumb.jpg',
    'https://lumalabs.ai/capture/d80d4876-cf71-4b8a-8b5b-49ffac44cd4a',
    true,
    'The delicate beauty of dandelion seeds 🌼 Macro 3D capture',
    'Garden',
    ARRAY['nature', 'macro', 'dandelion', '3Dcapture'],
    NOW() - INTERVAL '18 hours'
  ),
  -- Post 19 (from mockData) - Classical Sculpture
  (
    '550e8400-e29b-41d4-a716-446655440029',
    '550e8400-e29b-41d4-a716-446655440002',
    'https://cdn-luma.com/77b06b20dd103ee39f6c8fb54768068ce4f043c8f1cc238d563abe7e5c7a4a84/Jules_Desbois_La_Femme_l_thumb.jpg',
    'https://lumalabs.ai/capture/1b5f3e33-3900-4398-8795-b585ae13fd2d',
    true,
    'The delicate expression of classical sculpture 🗿 Museum collection in 3D',
    'Art Museum',
    ARRAY['sculpture', 'art', 'museum', '3Darchiving'],
    NOW() - INTERVAL '19 hours'
  ),
  -- Post 20 (from mockData) - Nebula Gaussian Splatting (different angle/version)
  (
    '550e8400-e29b-41d4-a716-446655440030',
    '550e8400-e29b-41d4-a716-446655440003',
    'https://uvyttgmfepjyiglggmgz.supabase.co/storage/v1/object/public/post-images/KakaoTalk_Photo_2026-01-13-19-26-25.png',
    'https://lumalabs.ai/capture/b86b7928-f130-40a5-8cac-8095f30eed54',
    true,
    'Nebula Gaussian Splatting visual ✨ Fantastic cosmic space',
    'Digital Art',
    ARRAY['nebula', 'space', 'digitalart', 'GaussianSplatting'],
    NOW() - INTERVAL '20 hours'
  ),
  -- Post 21 (from mockData) - Alps Winter Scenery
  (
    '550e8400-e29b-41d4-a716-446655440031',
    '550e8400-e29b-41d4-a716-446655440001',
    'https://uvyttgmfepjyiglggmgz.supabase.co/storage/v1/object/public/post-images/KakaoTalk_Photo_2026-01-13-19-32-00.png',
    'https://lumalabs.ai/capture/4da7cf32-865a-4515-8cb9-9dfc574c90c2',
    true,
    'Winter scenery of the Alps ❄️ Spectacular snow-covered mountains',
    'Arosa, Switzerland',
    ARRAY['Switzerland', 'Alps', 'snowscape', 'wintertravel'],
    NOW() - INTERVAL '21 hours'
  ),
  -- Post 22 (from mockData) - Vintage Globe
  (
    '550e8400-e29b-41d4-a716-446655440032',
    '550e8400-e29b-41d4-a716-446655440002',
    'https://cdn-luma.com/9e17d0d3af2763f04f279f832a5389b6f29beabe1db61ded704e9e40adbadc67/Sundial_by_janiefitzgeral_thumb.jpg',
    'https://lumalabs.ai/capture/ca9ea966-ca24-4ec1-ab0f-af665cb546ff',
    true,
    'Vintage globe collection 🌍 Rotate 360 degrees to enjoy',
    'MIT Campus',
    ARRAY['vintage', 'globe', 'interior', 'collection'],
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
  ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440011', 'Wow, this is really amazing work! 👍'),
  ('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440011', 'The Gaussian Splatting quality is incredible!'),
  ('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440012', 'The atmosphere is really nice ✨'),
  ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440013', 'The details are so vivid!'),
  ('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440014', 'I really want to visit this space'),
  ('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440015', 'So artistic 🎨');

-- Update profile stats to match the posts/likes/comments we just created
UPDATE profiles SET
  posts_count = (SELECT COUNT(*) FROM posts WHERE user_id = profiles.id),
  followers_count = FLOOR(RANDOM() * 5000 + 1000),
  following_count = FLOOR(RANDOM() * 1000 + 100);
