export interface User {
  id: string;
  email: string;
  username: string;
  profileImage?: string;
  bio?: string;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  createdAt: string;
}

export interface Post {
  id: string;
  userId: string;
  user: User;
  imageUrl: string;
  image3dUrl?: string;
  is3D: boolean;
  caption: string;
  location?: string;
  hashtags: string[];
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  createdAt: string;
  // 3D 편집 메타데이터
  editMetadata?: {
    textOverlay?: string;
    textPosition?: 'top' | 'center' | 'bottom';
    textColor?: string;
    removeBackground?: boolean;
  };
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  user: User;
  content: string;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
}

export interface CreatePostRequest {
  imageUrl: string;
  image3dUrl?: string;
  is3D: boolean;
  caption: string;
  location?: string;
  hashtags: string[];
  // 3D 편집 메타데이터
  editMetadata?: {
    textOverlay?: string;
    textPosition?: 'top' | 'center' | 'bottom';
    textColor?: string;
    removeBackground?: boolean;
  };
}

export interface LumaConvertRequest {
  imageUrl: string;
}

export interface LumaConvertResponse {
  taskId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  image3dUrl?: string;
}
