import React, { useEffect, useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { FullScreenPostCard } from '../../components/FullScreenPostCard';
import { api } from '../../services/api';
import type { Post } from '../../types';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function FeedScreen() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
    }
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

  const handleViewDetails = (postId: string) => {
    router.push(`/asset-viewer?postId=${postId}`);
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#60A5FA" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        renderItem={({ item }) => (
          <FullScreenPostCard
            post={item}
            onLike={handleLike}
            onComment={handleComment}
            onViewDetails={handleViewDetails}
          />
        )}
        keyExtractor={(item) => item.id}
        pagingEnabled
        snapToInterval={SCREEN_HEIGHT}
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  listContent: {
    flexGrow: 1,
  },
});
