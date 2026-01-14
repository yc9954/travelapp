import React, { createContext, useContext, useState, useCallback } from 'react';
import type { Post } from '../types';

interface PostContextType {
  updatePost: (postId: string, updates: Partial<Post>) => void;
  getPost: (postId: string) => Post | undefined;
}

const PostContext = createContext<PostContextType | undefined>(undefined);

// 전역 Post 캐시 (postId -> Post)
const postCache = new Map<string, Post>();

export function PostProvider({ children }: { children: React.ReactNode }) {
  const [, setUpdateTrigger] = useState(0);

  const updatePost = useCallback((postId: string, updates: Partial<Post>) => {
    const existingPost = postCache.get(postId);
    if (existingPost) {
      const updatedPost = { ...existingPost, ...updates };
      postCache.set(postId, updatedPost);
      // 강제 리렌더링 트리거
      setUpdateTrigger(prev => prev + 1);
    } else {
      // 새 post 추가
      const newPost = updates as Post;
      if (newPost.id) {
        postCache.set(postId, newPost);
        setUpdateTrigger(prev => prev + 1);
      }
    }
  }, []);

  const getPost = useCallback((postId: string) => {
    return postCache.get(postId);
  }, []);

  return (
    <PostContext.Provider value={{ updatePost, getPost }}>
      {children}
    </PostContext.Provider>
  );
}

export function usePostContext() {
  const context = useContext(PostContext);
  if (context === undefined) {
    throw new Error('usePostContext must be used within a PostProvider');
  }
  return context;
}

// 전역 함수로 export (Context 없이도 사용 가능)
export function updatePostInCache(postId: string, updates: Partial<Post>) {
  const existingPost = postCache.get(postId);
  if (existingPost) {
    const updatedPost = { ...existingPost, ...updates };
    postCache.set(postId, updatedPost);
  } else {
    const newPost = updates as Post;
    if (newPost.id) {
      postCache.set(postId, newPost);
    }
  }
}

export function getPostFromCache(postId: string): Post | undefined {
  return postCache.get(postId);
}

export function setPostInCache(postId: string, post: Post) {
  postCache.set(postId, post);
}
