import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Post } from '../types';

const AUTH_TOKEN_KEY = '@travelspace3d_auth_token';
const USER_DATA_KEY = '@travelspace3d_user_data';
const USER_POSTS_KEY = '@travelspace3d_user_posts';

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

  async clearAll(): Promise<void> {
    await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, USER_DATA_KEY, USER_POSTS_KEY]);
  },
};
