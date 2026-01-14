import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Post } from '../types';

const AUTH_TOKEN_KEY = '@travelspace3d_auth_token';
const USER_DATA_KEY = '@travelspace3d_user_data';
const USER_POSTS_KEY = '@travelspace3d_user_posts';
const LIKES_STATE_KEY = '@travelspace3d_likes_state';
const POST_COUNTS_KEY = '@travelspace3d_post_counts'; // postId -> { likesCount, commentsCount }

export const StorageService = {
  async saveAuthToken(token: string): Promise<void> {
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
  },

  async getAuthToken(): Promise<string | null> {
    return await AsyncStorage.getItem(AUTH_TOKEN_KEY);
  },

  async removeAuthToken(): Promise<void> {
    await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
  },

  async saveUserData(userData: any): Promise<void> {
    await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
  },

  async getUserData(): Promise<any | null> {
    const data = await AsyncStorage.getItem(USER_DATA_KEY);
    return data ? JSON.parse(data) : null;
  },

  async removeUserData(): Promise<void> {
    await AsyncStorage.removeItem(USER_DATA_KEY);
  },

  async saveUserPosts(posts: Post[]): Promise<void> {
    await AsyncStorage.setItem(USER_POSTS_KEY, JSON.stringify(posts));
  },

  async getUserPosts(): Promise<Post[]> {
    const data = await AsyncStorage.getItem(USER_POSTS_KEY);
    return data ? JSON.parse(data) : [];
  },

  async addUserPost(post: Post): Promise<void> {
    const posts = await this.getUserPosts();
    posts.unshift(post);
    await this.saveUserPosts(posts);
  },

  // 좋아요 상태 저장 (postId -> isLiked)
  async saveLikeState(postId: string, isLiked: boolean): Promise<void> {
    try {
      const likesState = await this.getLikesState();
      likesState[postId] = isLiked;
      await AsyncStorage.setItem(LIKES_STATE_KEY, JSON.stringify(likesState));
      console.log(`[Storage] Saved like state for post ${postId}:`, isLiked);
    } catch (error) {
      console.error(`[Storage] Failed to save like state for post ${postId}:`, error);
      throw error;
    }
  },

  // 좋아요 상태 조회
  async getLikesState(): Promise<Record<string, boolean>> {
    const data = await AsyncStorage.getItem(LIKES_STATE_KEY);
    return data ? JSON.parse(data) : {};
  },

  // 특정 post의 좋아요 상태 조회
  async getLikeState(postId: string): Promise<boolean | null> {
    const likesState = await this.getLikesState();
    return likesState[postId] ?? null;
  },

  // 좋아요 상태 일괄 저장
  async saveLikesState(likesState: Record<string, boolean>): Promise<void> {
    await AsyncStorage.setItem(LIKES_STATE_KEY, JSON.stringify(likesState));
  },

  // Post 카운트 저장 (likesCount, commentsCount)
  async savePostCounts(postId: string, counts: { likesCount: number; commentsCount: number }): Promise<void> {
    try {
      const postCounts = await this.getPostCounts();
      postCounts[postId] = counts;
      await AsyncStorage.setItem(POST_COUNTS_KEY, JSON.stringify(postCounts));
      console.log(`[Storage] Saved counts for post ${postId}:`, counts);
    } catch (error) {
      console.error(`[Storage] Failed to save counts for post ${postId}:`, error);
      throw error;
    }
  },

  // Post 카운트 조회
  async getPostCounts(): Promise<Record<string, { likesCount: number; commentsCount: number }>> {
    const data = await AsyncStorage.getItem(POST_COUNTS_KEY);
    return data ? JSON.parse(data) : {};
  },

  // 특정 post의 카운트 조회
  async getPostCount(postId: string): Promise<{ likesCount: number; commentsCount: number } | null> {
    const postCounts = await this.getPostCounts();
    return postCounts[postId] ?? null;
  },

  // 좋아요 상태와 카운트 일관성 검증 및 수정
  // likesCount가 0인데 isLiked가 true인 경우를 수정
  async validateAndFixLikeState(): Promise<void> {
    try {
      const postCounts = await this.getPostCounts();
      const likesState = await this.getLikesState();
      let hasChanges = false;
      const fixedLikesState = { ...likesState };

      // 모든 post에 대해 검증
      for (const [postId, counts] of Object.entries(postCounts)) {
        const isLiked = likesState[postId];
        
        // likesCount가 0인데 isLiked가 true인 경우 수정
        if (counts.likesCount === 0 && isLiked === true) {
          console.log(`[Storage] Fixing inconsistent like state for post ${postId}: likesCount=0 but isLiked=true`);
          fixedLikesState[postId] = false;
          hasChanges = true;
        }
      }

      // 변경사항이 있으면 저장
      if (hasChanges) {
        await this.saveLikesState(fixedLikesState);
        console.log(`[Storage] Fixed ${Object.keys(fixedLikesState).filter(id => likesState[id] !== fixedLikesState[id]).length} inconsistent like states`);
      }
    } catch (error) {
      console.error('[Storage] Failed to validate and fix like state:', error);
    }
  },

  async clearAll(): Promise<void> {
    await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, USER_DATA_KEY, USER_POSTS_KEY, LIKES_STATE_KEY, POST_COUNTS_KEY]);
  },
};
