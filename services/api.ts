import { SupabaseAPI } from './supabase-api';
import { StorageService } from './storage';
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  Post,
  User,
  CreatePostRequest,
  Comment,
} from '../types';

class ApiService {
  // ==================== Auth ====================

  async login(data: LoginRequest): Promise<AuthResponse> {
    const authData = await SupabaseAPI.signInWithEmail(data.email, data.password);

    if (!authData.user || !authData.session) {
      throw new Error('Login failed');
    }

    // Get user profile
    const profile = await SupabaseAPI.getProfile(authData.user.id);

    // Save to storage
    await StorageService.saveAuthToken(authData.session.access_token);
    await StorageService.saveUserData(profile);

    return {
      user: profile,
      token: authData.session.access_token,
    };
  }

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const authData = await SupabaseAPI.signUpWithEmail(
      data.email,
      data.password,
      data.username
    );

    if (!authData.user || !authData.session) {
      throw new Error('Registration failed');
    }

    // Get user profile (created by trigger)
    const profile = await SupabaseAPI.getProfile(authData.user.id);

    // Save to storage
    await StorageService.saveAuthToken(authData.session.access_token);
    await StorageService.saveUserData(profile);

    return {
      user: profile,
      token: authData.session.access_token,
    };
  }

  // ==================== Posts ====================

  async getFeed(page: number = 1, limit: number = 20): Promise<Post[]> {
    return await SupabaseAPI.getFeed(page, limit);
  }

  async getUserPosts(userId: string): Promise<Post[]> {
    return await SupabaseAPI.getUserPosts(userId);
  }

  async getPost(postId: string): Promise<Post> {
    return await SupabaseAPI.getPost(postId);
  }

  async createPost(data: CreatePostRequest): Promise<Post> {
    const post = await SupabaseAPI.createPost(data);

    // Update local user data
    const userData = await StorageService.getUserData();
    if (userData) {
      userData.postsCount = (userData.postsCount || 0) + 1;
      await StorageService.saveUserData(userData);
    }

    return post;
  }

  async deletePost(postId: string): Promise<void> {
    await SupabaseAPI.deletePost(postId);

    // Update local user data
    const userData = await StorageService.getUserData();
    if (userData) {
      userData.postsCount = Math.max(0, (userData.postsCount || 1) - 1);
      await StorageService.saveUserData(userData);
    }
  }

  // ==================== Likes ====================

  async likePost(postId: string): Promise<void> {
    await SupabaseAPI.likePost(postId);
  }

  async unlikePost(postId: string): Promise<void> {
    await SupabaseAPI.unlikePost(postId);
  }

  async getPostLikes(postId: string): Promise<User[]> {
    return await SupabaseAPI.getPostLikes(postId);
  }

  // ==================== Comments ====================

  async getComments(postId: string): Promise<Comment[]> {
    return await SupabaseAPI.getPostComments(postId);
  }

  async createComment(postId: string, content: string): Promise<Comment> {
    return await SupabaseAPI.createComment(postId, content);
  }

  async deleteComment(commentId: string): Promise<void> {
    await SupabaseAPI.deleteComment(commentId);
  }

  // ==================== Profile ====================

  async getUserProfile(userId: string, userMetadata?: any): Promise<User> {
    return await SupabaseAPI.getProfile(userId, userMetadata);
  }

  async updateUserProfile(userId: string, updates: Partial<User>): Promise<User> {
    const profile = await SupabaseAPI.updateProfile(userId, updates);

    // Update local storage
    const userData = await StorageService.getUserData();
    if (userData && userData.id === userId) {
      await StorageService.saveUserData(profile);
    }

    return profile;
  }

  // ==================== Follows ====================

  async followUser(userId: string, currentUserId: string): Promise<void> {
    await SupabaseAPI.followUser(userId, currentUserId);

    // 트리거가 카운트를 업데이트하므로, 프로필을 다시 조회하여 정확한 카운트 반영
    const userData = await StorageService.getUserData();
    if (userData && userData.id === currentUserId) {
      try {
        const updatedProfile = await SupabaseAPI.getProfile(currentUserId);
        await StorageService.saveUserData(updatedProfile);
      } catch (error) {
        console.error('Failed to refresh profile after follow:', error);
        // 실패하면 낙관적 업데이트로 폴백
        userData.followingCount = (userData.followingCount || 0) + 1;
        await StorageService.saveUserData(userData);
      }
    }
  }

  async unfollowUser(userId: string, currentUserId: string): Promise<void> {
    await SupabaseAPI.unfollowUser(userId, currentUserId);

    // 트리거가 카운트를 업데이트하므로, 프로필을 다시 조회하여 정확한 카운트 반영
    const userData = await StorageService.getUserData();
    if (userData && userData.id === currentUserId) {
      try {
        const updatedProfile = await SupabaseAPI.getProfile(currentUserId);
        await StorageService.saveUserData(updatedProfile);
      } catch (error) {
        console.error('Failed to refresh profile after unfollow:', error);
        // 실패하면 낙관적 업데이트로 폴백
        userData.followingCount = Math.max(0, (userData.followingCount || 1) - 1);
        await StorageService.saveUserData(userData);
      }
    }
  }

  async isFollowing(userId: string, currentUserId: string): Promise<boolean> {
    return await SupabaseAPI.isFollowing(userId, currentUserId);
  }

  async getFollowers(userId: string): Promise<User[]> {
    return await SupabaseAPI.getFollowers(userId);
  }

  async getFollowing(userId: string): Promise<User[]> {
    return await SupabaseAPI.getFollowing(userId);
  }

  // ==================== Upload ====================

  async uploadImage(uri: string): Promise<string> {
    // For now, return the URI as-is
    // In production, upload to Supabase Storage
    return uri;
  }
}

export const api = new ApiService();
