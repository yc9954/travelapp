import React, { useEffect, useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Text,
  ScrollView,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { InteractiveSceneCard } from '../../components/InteractiveSceneCard';
import { PostCard } from '../../components/PostCard';
import { api } from '../../services/api';
import type { Post } from '../../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function FeedScreen() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadFeed();
  }, []);

  const loadFeed = async () => {
    try {
      const data = await api.getFeed();
      setPosts(data);
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

  const handleLike = async (postId: string) => {
    try {
      const post = posts.find(p => p.id === postId);
      if (!post) return;

      if (post.isLiked) {
        await api.unlikePost(postId);
        setPosts(posts.map(p =>
          p.id === postId
            ? { ...p, isLiked: false, likesCount: p.likesCount - 1 }
            : p
        ));
      } else {
        await api.likePost(postId);
        setPosts(posts.map(p =>
          p.id === postId
            ? { ...p, isLiked: true, likesCount: p.likesCount + 1 }
            : p
        ));
      }
    } catch (error) {
      console.error('Failed to toggle like:', error);
    }
  };

  const handleComment = (postId: string) => {
    console.log('Open comments for post:', postId);
  };

  const handleViewPost = (postId: string) => {
    router.push(`/asset-viewer?postId=${postId}`);
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  const featuredPost = posts.length > 0 ? posts[0] : null;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#6366F1"
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
            {posts.map((item, index) => (
              <View key={item.id} style={styles.gridItem}>
                <PostCard
                  post={item}
                  onLike={handleLike}
                  onComment={handleComment}
                  onViewPost={handleViewPost}
                />
              </View>
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
    backgroundColor: '#000000',
  },
  scrollView: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  featuredSection: {
    backgroundColor: '#000000',
    paddingTop: 24,
    paddingBottom: 100, // Extra padding for tab bar
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  grid: {
    paddingHorizontal: 16,
    gap: 16,
  },
  gridItem: {
    marginBottom: 16,
  },
});
