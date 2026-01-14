import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../../services/api';
import { getPostFromCache, setPostInCache } from '../../contexts/PostContext';
import { StorageService } from '../../services/storage';
import type { Post } from '../../types';

export default function ExploreScreen() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadPosts();
  }, []);

  // 화면이 포커스될 때마다 캐시된 post와 로컬 스토리지 업데이트 반영
  useFocusEffect(
    React.useCallback(() => {
      if (!isLoading && posts.length > 0) {
        // 로컬 스토리지에서 카운트와 좋아요 상태 조회
        StorageService.getPostCounts().then(postCounts => {
          StorageService.getLikesState().then(likesState => {
            setPosts(currentPosts => {
              // 캐시된 post나 로컬 스토리지 값이 있으면 즉시 업데이트
              const updatedPosts = currentPosts.map(post => {
                const cachedPost = getPostFromCache(post.id);
                const storedCounts = postCounts[post.id];
                const storedLikeState = likesState[post.id];
                
                // 우선순위: 캐시 > 로컬 스토리지 > 현재 값
                if (cachedPost) {
                  // 캐시 값이 있으면 무조건 캐시 값 사용 (최신 업데이트 반영)
                  return {
                    ...post,
                    likesCount: cachedPost.likesCount,
                    commentsCount: cachedPost.commentsCount,
                    isLiked: cachedPost.isLiked,
                  };
                } else if (storedCounts || storedLikeState !== undefined) {
                  // 로컬 스토리지 값 사용
                  return {
                    ...post,
                    likesCount: storedCounts?.likesCount ?? post.likesCount,
                    commentsCount: storedCounts?.commentsCount ?? post.commentsCount,
                    isLiked: storedLikeState ?? post.isLiked,
                  };
                }
                // 둘 다 없으면 현재 post 값 유지
                return post;
              });
              // 변경사항이 있는지 확인
              const hasChanges = updatedPosts.some((post, index) => {
                const original = currentPosts[index];
                return post.likesCount !== original.likesCount ||
                       post.commentsCount !== original.commentsCount ||
                       post.isLiked !== original.isLiked;
              });
              return hasChanges ? updatedPosts : currentPosts;
            });
          });
        });
      }
    }, [isLoading, posts.length])
  );

  const loadPosts = async () => {
    try {
      // 먼저 좋아요 상태 일관성 검증 및 수정
      await StorageService.validateAndFixLikeState();
      
      const data = await api.getFeed();
      // 로컬 스토리지에서 카운트와 좋아요 상태 조회
      const postCounts = await StorageService.getPostCounts();
      const likesState = await StorageService.getLikesState();
      
      // 첫 로드 여부 확인: 로컬 스토리지에 데이터가 있는지 확인
      const isFirstLoad = Object.keys(postCounts).length === 0 && Object.keys(likesState).length === 0;
      
      const updatedData = await Promise.all(
        data.map(async post => {
          const cachedPost = getPostFromCache(post.id);
          const storedCounts = postCounts[post.id];
          const storedLikeState = likesState[post.id];
          
          let finalPost = { ...post };
          
          // 우선순위 1: 캐시에 최근 업데이트한 값이 있으면 그것 사용 (내가 방금 업데이트한 경우)
          if (cachedPost) {
            finalPost = {
              ...finalPost,
              likesCount: cachedPost.likesCount,
              commentsCount: cachedPost.commentsCount,
              isLiked: cachedPost.isLiked,
            };
          } else if (isFirstLoad) {
            // 첫 로드: 서버 값으로 로컬 스토리지 초기화
            console.log(`[Explore] First load: Initializing local storage with server values for post ${post.id}`);
            await StorageService.savePostCounts(post.id, {
              likesCount: post.likesCount,
              commentsCount: post.commentsCount,
            });
            await StorageService.saveLikeState(post.id, post.isLiked);
            finalPost = {
              ...finalPost,
              likesCount: post.likesCount,
              commentsCount: post.commentsCount,
              isLiked: post.isLiked,
            };
          } else {
            // 이후 로드: 로컬 스토리지 값 사용
            if (storedCounts) {
              console.log(`[Explore] Using stored counts for post ${post.id}:`, storedCounts);
              finalPost = {
                ...finalPost,
                likesCount: storedCounts.likesCount,
                commentsCount: storedCounts.commentsCount,
              };
            }
            if (storedLikeState !== undefined) {
              console.log(`[Explore] Using stored like state for post ${post.id}:`, storedLikeState);
              finalPost = {
                ...finalPost,
                isLiked: storedLikeState,
              };
            }
          }
          
          // 최종 검증: likesCount가 0인데 isLiked가 true인 경우 수정
          if (finalPost.likesCount === 0 && finalPost.isLiked === true) {
            console.log(`[Explore] Fixing inconsistent state: post ${post.id} has 0 likes but is marked as liked`);
            finalPost.isLiked = false;
            await StorageService.saveLikeState(post.id, false);
          }
          
          // 캐시에 저장
          setPostInCache(post.id, finalPost);
          
          return finalPost;
        })
      );
      setPosts(updatedData);
    } catch (error) {
      console.error('Failed to load posts:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadPosts();
  };

  const handlePostPress = (post: Post) => {
    router.push({
      pathname: '/asset-viewer',
      params: { postId: post.id },
    });
  };

  const renderPost = ({ item }: { item: Post }) => (
    <TouchableOpacity
      style={styles.gridItem}
      onPress={() => handlePostPress(item)}
      activeOpacity={0.9}
    >
      <Image
        source={{ uri: item.imageUrl }}
        style={styles.gridImage}
        resizeMode="cover"
      />
      <View style={styles.overlay}>
        <View style={styles.overlayContent}>
          <Ionicons name="heart" size={16} color="#FFFFFF" />
          <Text style={styles.overlayText}>{item.likesCount}</Text>
        </View>
        <View style={styles.overlayContent}>
          <Ionicons name="chatbubble" size={16} color="#FFFFFF" />
          <Text style={styles.overlayText}>{item.commentsCount}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Explore</Text>
      </View>
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        numColumns={3}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#6366F1"
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  listContent: {
    padding: 1,
  },
  gridItem: {
    flex: 1 / 3,
    aspectRatio: 1,
    margin: 0.5,
    position: 'relative',
    backgroundColor: '#F3F4F6',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  overlayContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  overlayText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
