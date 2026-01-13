import { supabase } from '../lib/supabase';
import type { Post, User, Comment, CreatePostRequest } from '../types';

// User profile type from Supabase
interface SupabaseProfile {
  id: string;
  username: string;
  email: string;
  profile_image: string | null;
  bio: string | null;
  followers_count: number;
  following_count: number;
  posts_count: number;
  created_at: string;
}

// Post type from Supabase
interface SupabasePost {
  id: string;
  user_id: string;
  image_url: string;
  image_3d_url: string | null;
  is_3d: boolean;
  caption: string;
  location: string | null;
  hashtags: string[];
  likes_count: number;
  comments_count: number;
  edit_metadata: any;
  created_at: string;
  profiles: SupabaseProfile;
  user_liked?: boolean;
}

// Convert Supabase profile to User type
function convertProfile(profile: SupabaseProfile): User {
  return {
    id: profile.id,
    email: profile.email,
    username: profile.username,
    profileImage: profile.profile_image || undefined,
    bio: profile.bio || '',
    followersCount: profile.followers_count,
    followingCount: profile.following_count,
    postsCount: profile.posts_count,
    createdAt: profile.created_at,
  };
}

// Convert Supabase post to Post type
function convertPost(post: SupabasePost): Post {
  return {
    id: post.id,
    userId: post.user_id,
    user: convertProfile(post.profiles),
    imageUrl: post.image_url,
    image3dUrl: post.image_3d_url || undefined,
    is3D: post.is_3d,
    caption: post.caption,
    location: post.location || undefined,
    hashtags: post.hashtags || [],
    likesCount: post.likes_count,
    commentsCount: post.comments_count,
    isLiked: post.user_liked || false,
    editMetadata: post.edit_metadata || null,
    createdAt: post.created_at,
  };
}

export const SupabaseAPI = {
  // ==================== Auth ====================

  async signUpWithEmail(email: string, password: string, username: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
        },
      },
    });

    if (error) throw error;
    return data;
  },

  async signInWithEmail(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  },

  // ==================== Profile ====================

  async getProfile(userId: string): Promise<User> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return convertProfile(data);
  },

  async updateProfile(userId: string, updates: Partial<User>) {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        username: updates.username,
        bio: updates.bio,
        profile_image: updates.profileImage,
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return convertProfile(data);
  },

  // ==================== Posts ====================

  async getFeed(page: number = 1, limit: number = 20): Promise<Post[]> {
    // 환경 변수 체크
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error(
        'Supabase 환경 변수가 설정되지 않았습니다.\n' +
        '프로젝트 루트에 .env 파일을 생성하고 EXPO_PUBLIC_SUPABASE_URL과 EXPO_PUBLIC_SUPABASE_ANON_KEY를 설정하세요.\n' +
        '자세한 내용은 SUPABASE_SETUP.md를 참고하세요.'
      );
    }

    const { data: { user } } = await supabase.auth.getUser();
    const offset = (page - 1) * limit;

    // Get posts with user info and like status
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        profiles (*)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      // 디버깅: 실제 에러 정보 출력
      console.error('❌ Supabase 에러 상세 정보:');
      console.error('  Code:', error.code);
      console.error('  Message:', error.message);
      console.error('  Details:', error.details);
      console.error('  Hint:', error.hint);
      console.error('  Full error:', JSON.stringify(error, null, 2));
      
      // Invalid API key 에러인 경우 더 명확한 메시지 제공
      if (error.message?.includes('Invalid API key') || error.message?.includes('API key') || error.code === 'PGRST301') {
        throw new Error(
          'Supabase API 키가 유효하지 않습니다.\n' +
          '.env 파일의 EXPO_PUBLIC_SUPABASE_URL과 EXPO_PUBLIC_SUPABASE_ANON_KEY를 확인하세요.\n' +
          'Supabase 대시보드 > Settings > API에서 올바른 키를 복사했는지 확인하세요.\n' +
          `에러 코드: ${error.code || 'N/A'}\n` +
          `에러 메시지: ${error.message || 'N/A'}`
        );
      }
      throw error;
    }

    // Check if current user liked each post
    if (user) {
      const postIds = data.map(p => p.id);
      const { data: likes } = await supabase
        .from('likes')
        .select('post_id')
        .eq('user_id', user.id)
        .in('post_id', postIds);

      const likedPostIds = new Set(likes?.map(l => l.post_id) || []);

      return data.map(post => convertPost({
        ...post,
        user_liked: likedPostIds.has(post.id),
      }));
    }

    return data.map(post => convertPost(post));
  },

  async getUserPosts(userId: string): Promise<Post[]> {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        profiles (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Check if current user liked each post
    if (user) {
      const postIds = data.map(p => p.id);
      const { data: likes } = await supabase
        .from('likes')
        .select('post_id')
        .eq('user_id', user.id)
        .in('post_id', postIds);

      const likedPostIds = new Set(likes?.map(l => l.post_id) || []);

      return data.map(post => convertPost({
        ...post,
        user_liked: likedPostIds.has(post.id),
      }));
    }

    return data.map(post => convertPost(post));
  },

  async getPost(postId: string): Promise<Post> {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        profiles (*)
      `)
      .eq('id', postId)
      .single();

    if (error) throw error;

    // Check if current user liked this post
    let isLiked = false;
    if (user) {
      const { data: like } = await supabase
        .from('likes')
        .select('id')
        .eq('user_id', user.id)
        .eq('post_id', postId)
        .single();

      isLiked = !!like;
    }

    return convertPost({ ...data, user_liked: isLiked });
  },

  async createPost(postData: CreatePostRequest): Promise<Post> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('posts')
      .insert({
        user_id: user.id,
        image_url: postData.imageUrl,
        image_3d_url: postData.image3dUrl,
        is_3d: postData.is3D,
        caption: postData.caption,
        location: postData.location,
        hashtags: postData.hashtags,
        edit_metadata: postData.editMetadata,
      })
      .select(`
        *,
        profiles (*)
      `)
      .single();

    if (error) throw error;
    return convertPost(data);
  },

  async deletePost(postId: string) {
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId);

    if (error) throw error;
  },

  // ==================== Likes ====================

  async likePost(postId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('likes')
      .insert({
        user_id: user.id,
        post_id: postId,
      });

    if (error) throw error;
  },

  async unlikePost(postId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('likes')
      .delete()
      .eq('user_id', user.id)
      .eq('post_id', postId);

    if (error) throw error;
  },

  async getPostLikes(postId: string): Promise<User[]> {
    const { data, error } = await supabase
      .from('likes')
      .select(`
        profiles (*)
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data.map(like => convertProfile(like.profiles as any));
  },

  // ==================== Comments ====================

  async getPostComments(postId: string): Promise<Comment[]> {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        profiles (*)
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(comment => ({
      id: comment.id,
      userId: comment.user_id,
      user: convertProfile(comment.profiles as any),
      postId: comment.post_id,
      content: comment.text,
      createdAt: comment.created_at,
    }));
  },

  async createComment(postId: string, text: string): Promise<Comment> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('comments')
      .insert({
        user_id: user.id,
        post_id: postId,
        text,
      })
      .select(`
        *,
        profiles (*)
      `)
      .single();

    if (error) throw error;

    return {
      id: data.id,
      userId: data.user_id,
      user: convertProfile(data.profiles as any),
      postId: data.post_id,
      content: data.text,
      createdAt: data.created_at,
    };
  },

  async deleteComment(commentId: string) {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId);

    if (error) throw error;
  },

  // ==================== Follows ====================

  async followUser(userId: string, currentUserId: string) {
    if (!currentUserId) throw new Error('Not authenticated');
    if (currentUserId === userId) throw new Error('Cannot follow yourself');

    const { error } = await supabase
      .from('follows')
      .insert({
        follower_id: currentUserId,
        following_id: userId,
      });

    if (error) throw error;
  },

  async unfollowUser(userId: string, currentUserId: string) {
    if (!currentUserId) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', currentUserId)
      .eq('following_id', userId);

    if (error) throw error;
  },

  async isFollowing(userId: string, currentUserId: string): Promise<boolean> {
    if (!currentUserId) return false;

    const { data, error } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', currentUserId)
      .eq('following_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
    return !!data;
  },

  async getFollowers(userId: string): Promise<User[]> {
    const { data, error } = await supabase
      .from('follows')
      .select(`
        follower:follower_id (*)
      `)
      .eq('following_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data.map(follow => convertProfile(follow.follower as any));
  },

  async getFollowing(userId: string): Promise<User[]> {
    const { data, error } = await supabase
      .from('follows')
      .select(`
        following:following_id (*)
      `)
      .eq('follower_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data.map(follow => convertProfile(follow.following as any));
  },
};
