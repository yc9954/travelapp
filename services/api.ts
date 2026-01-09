import axios, { AxiosInstance } from 'axios';
import { StorageService } from './storage';
import { mockPosts, mockUsers, createMockAuthResponse, delay } from './mockData';
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  Post,
  User,
  CreatePostRequest,
} from '../types';

// Mock 모드 활성화 (백엔드 없이 테스트하려면 true로 설정)
const USE_MOCK_API = true;

const API_BASE_URL = __DEV__
  ? 'http://10.0.2.2:3000/api'
  : 'https://api.travelspace3d.com/api';

class ApiService {
  private client: AxiosInstance;
  private mockPosts: Post[] = [...mockPosts];

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.request.use(
      async (config) => {
        const token = await StorageService.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          await StorageService.clearAll();
        }
        return Promise.reject(error);
      }
    );
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    if (USE_MOCK_API) {
      await delay(800); // 네트워크 지연 시뮬레이션
      // Mock: 어떤 이메일/비밀번호든 로그인 성공
      return createMockAuthResponse(data.email, data.email.split('@')[0]);
    }
    const response = await this.client.post<AuthResponse>('/auth/login', data);
    return response.data;
  }

  async register(data: RegisterRequest): Promise<AuthResponse> {
    if (USE_MOCK_API) {
      await delay(800);
      return createMockAuthResponse(data.email, data.username);
    }
    const response = await this.client.post<AuthResponse>('/auth/register', data);
    return response.data;
  }

  async getFeed(page: number = 1, limit: number = 10): Promise<Post[]> {
    if (USE_MOCK_API) {
      await delay(500);
      return this.mockPosts;
    }
    const response = await this.client.get<Post[]>('/posts/feed', {
      params: { page, limit },
    });
    return response.data;
  }

  async getUserPosts(userId: string): Promise<Post[]> {
    if (USE_MOCK_API) {
      await delay(500);
      // 현재 로그인한 사용자의 게시물만 필터링
      return this.mockPosts.filter(post => post.userId === userId);
    }
    const response = await this.client.get<Post[]>(`/posts/user/${userId}`);
    return response.data;
  }

  async createPost(data: CreatePostRequest): Promise<Post> {
    if (USE_MOCK_API) {
      await delay(1000);
      const userData = await StorageService.getUserData();
      const newPost: Post = {
        id: Date.now().toString(),
        userId: userData?.id || '1',
        user: userData || mockUsers[0],
        imageUrl: data.imageUrl,
        image3dUrl: data.image3dUrl,
        is3D: data.is3D,
        caption: data.caption,
        location: data.location,
        hashtags: data.hashtags,
        likesCount: 0,
        commentsCount: 0,
        isLiked: false,
        createdAt: new Date().toISOString(),
      };
      this.mockPosts.unshift(newPost); // 새 게시물을 맨 앞에 추가
      return newPost;
    }
    const response = await this.client.post<Post>('/posts', data);
    return response.data;
  }

  async likePost(postId: string): Promise<void> {
    if (USE_MOCK_API) {
      await delay(300);
      const post = this.mockPosts.find(p => p.id === postId);
      if (post) {
        post.isLiked = true;
        post.likesCount++;
      }
      return;
    }
    await this.client.post(`/posts/${postId}/like`);
  }

  async unlikePost(postId: string): Promise<void> {
    if (USE_MOCK_API) {
      await delay(300);
      const post = this.mockPosts.find(p => p.id === postId);
      if (post) {
        post.isLiked = false;
        post.likesCount--;
      }
      return;
    }
    await this.client.delete(`/posts/${postId}/like`);
  }

  async getUserProfile(userId: string): Promise<User> {
    if (USE_MOCK_API) {
      await delay(500);
      return mockUsers.find(u => u.id === userId) || mockUsers[0];
    }
    const response = await this.client.get<User>(`/users/${userId}`);
    return response.data;
  }

  async uploadImage(uri: string): Promise<string> {
    if (USE_MOCK_API) {
      await delay(1500);
      // Mock: 그냥 원본 URI 반환 (실제로는 서버에 업로드)
      return uri;
    }
    const formData = new FormData();
    const filename = uri.split('/').pop() || 'image.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    formData.append('image', {
      uri,
      name: filename,
      type,
    } as any);

    const response = await this.client.post<{ url: string }>('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.url;
  }
}

export const api = new ApiService();
