import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Text,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { InteractiveSceneCard } from '../../components/InteractiveSceneCard';
import { api } from '../../services/api';
import type { Post } from '../../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_ITEM_WIDTH = (SCREEN_WIDTH - 48) / 2; // 2 columns with padding

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

  const handleViewPost = (postId: string) => {
    router.push(`/asset-viewer?postId=${postId}`);
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#60A5FA" />
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
            tintColor="#60A5FA"
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
              <TouchableOpacity
                key={item.id}
                style={styles.gridItem}
                onPress={() => handleViewPost(item.id)}
                activeOpacity={0.8}
              >
                <View style={styles.imageContainer}>
                  <Image
                    source={{ uri: item.imageUrl }}
                    style={styles.image}
                    resizeMode="cover"
                  />
                  {item.is3D && (
                    <View style={styles.badge3D}>
                      <Ionicons name="cube-outline" size={12} color="#FFFFFF" />
                      <Text style={styles.badge3DText}>3D</Text>
                    </View>
                  )}
                </View>
                <View style={styles.info}>
                  <View style={styles.likesContainer}>
                    <Ionicons name="heart" size={16} color="#EF4444" />
                    <Text style={styles.likesText}>{item.likesCount}</Text>
                  </View>
                </View>
              </TouchableOpacity>
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
    paddingBottom: 100,
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
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  gridItem: {
    width: GRID_ITEM_WIDTH,
    marginBottom: 16,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1E293B',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  badge3D: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  badge3DText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  info: {
    paddingTop: 8,
  },
  likesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  likesText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
