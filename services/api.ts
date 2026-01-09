import axios, { AxiosInstance } from 'axios';
import { StorageService } from './storage';
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  Post,
  User,
  CreatePostRequest,
} from '../types';

const API_BASE_URL = __DEV__
  ? 'http://10.0.2.2:3000/api'
  : 'https://api.travelspace3d.com/api';

class ApiService {
  private client: AxiosInstance;

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
    const response = await this.client.post<AuthResponse>('/auth/login', data);
    return response.data;
  }

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>('/auth/register', data);
    return response.data;
  }

  async getFeed(page: number = 1, limit: number = 10): Promise<Post[]> {
    const response = await this.client.get<Post[]>('/posts/feed', {
      params: { page, limit },
    });
    return response.data;
  }

  async getUserPosts(userId: string): Promise<Post[]> {
    const response = await this.client.get<Post[]>(`/posts/user/${userId}`);
    return response.data;
  }

  async createPost(data: CreatePostRequest): Promise<Post> {
    const response = await this.client.post<Post>('/posts', data);
    return response.data;
  }

  async likePost(postId: string): Promise<void> {
    await this.client.post(`/posts/${postId}/like`);
  }

  async unlikePost(postId: string): Promise<void> {
    await this.client.delete(`/posts/${postId}/like`);
  }

  async getUserProfile(userId: string): Promise<User> {
    const response = await this.client.get<User>(`/users/${userId}`);
    return response.data;
  }

  async uploadImage(uri: string): Promise<string> {
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
