import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Image,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { InteractiveSceneCard } from '../../components/InteractiveSceneCard';
import { api } from '../../services/api';
import { getPostFromCache, setPostInCache } from '../../contexts/PostContext';
import { StorageService } from '../../services/storage';
import type { Post } from '../../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_ITEM_WIDTH = (SCREEN_WIDTH - 40) / 2; // 2 columns with padding (reduced padding for larger items)

interface GridItemProps {
  item: Post;
  onPress: () => void;
}

function GridItem({ item, onPress }: GridItemProps) {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  return (
    <TouchableOpacity
      style={styles.gridItem}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.imageContainer}>
        {imageLoading && (
          <View style={styles.imageLoadingContainer}>
            <ActivityIndicator size="small" color="#1F2937" />
          </View>
        )}
        {imageError ? (
          <View style={styles.imageErrorContainer}>
            <Ionicons name="image-outline" size={40} color="#D1D5DB" />
          </View>
        ) : (
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.image}
            resizeMode="cover"
            onLoadStart={() => setImageLoading(true)}
            onLoadEnd={() => setImageLoading(false)}
            onError={() => {
              setImageLoading(false);
              setImageError(true);
            }}
          />
        )}
        <View style={styles.statsOverlay}>
          <View style={styles.statItem}>
            <Ionicons name="heart" size={14} color="#FFFFFF" />
            <Text style={styles.statText}>{item.likesCount}</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="chatbubble" size={14} color="#FFFFFF" />
            <Text style={styles.statText}>{item.commentsCount}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function FeedScreen() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadFeed();
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

  const loadFeed = async () => {
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
            console.log(`[Feed] First load: Initializing local storage with server values for post ${post.id}`);
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
              console.log(`[Feed] Using stored counts for post ${post.id}:`, storedCounts);
              finalPost = {
                ...finalPost,
                likesCount: storedCounts.likesCount,
                commentsCount: storedCounts.commentsCount,
              };
            }
            if (storedLikeState !== undefined) {
              console.log(`[Feed] Using stored like state for post ${post.id}:`, storedLikeState);
              finalPost = {
                ...finalPost,
                isLiked: storedLikeState,
              };
            }
          }
          
          // 최종 검증: likesCount가 0인데 isLiked가 true인 경우 수정
          if (finalPost.likesCount === 0 && finalPost.isLiked === true) {
            console.log(`[Feed] Fixing inconsistent state: post ${post.id} has 0 likes but is marked as liked`);
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
      console.error('Failed to load feed:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadFeed();
  };

  const handleViewPost = (postId: string) => {
    router.push(`/asset-viewer?postId=${postId}`);
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1F2937" />
      </View>
    );
  }

  // featuredPost도 캐시와 로컬 스토리지에서 업데이트
  const featuredPost = posts.length > 0 ? (() => {
    const post = posts[0];
    const cachedPost = getPostFromCache(post.id);
    if (cachedPost) {
      return {
        ...post,
        likesCount: cachedPost.likesCount,
        commentsCount: cachedPost.commentsCount,
        isLiked: cachedPost.isLiked,
      };
    }
    // 캐시가 없으면 이미 posts에 로컬 스토리지 값이 반영되어 있음
    return post;
  })() : null;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#1F2937"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Interactive Scene Section */}
        {featuredPost && <InteractiveSceneCard post={featuredPost} />}

        {/* Featured Scenes Section */}
        <View style={styles.featuredSection}>
          <Text style={styles.sectionTitle}>Featured Scenes</Text>

          <View style={styles.grid}>
            {posts.slice(1).map((item) => (
              <GridItem
                key={item.id}
                item={item}
                onPress={() => handleViewPost(item.id)}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  featuredSection: {
    backgroundColor: '#FFFFFF',
    paddingTop: 0,
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
    marginTop: 20,
    paddingHorizontal: 20,
    letterSpacing: -0.5,
  },
  grid: {
    paddingHorizontal: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridItem: {
    width: GRID_ITEM_WIDTH,
    marginBottom: 12,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageLoadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  imageErrorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  statsOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    gap: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
    backdropFilter: 'blur(10px)',
  },
  statText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
});
