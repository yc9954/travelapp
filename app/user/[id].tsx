import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import type { Post, User } from '../../types';

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  useEffect(() => {
    if (id) {
      loadUserProfile();
      loadUserPosts();
      checkFollowStatus();
    }
  }, [id]);

  const loadUserProfile = async () => {
    if (!id) return;

    try {
      const userData = await api.getUserProfile(id);
      setUser(userData);
    } catch (error) {
      console.error('Failed to load user profile:', error);
      Alert.alert('오류', '사용자 프로필을 불러올 수 없습니다.');
    }
  };

  const loadUserPosts = async () => {
    if (!id) return;

    try {
      const data = await api.getUserPosts(id);
      setPosts(data);
    } catch (error) {
      console.error('Failed to load user posts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkFollowStatus = async () => {
    if (!id) return;

    try {
      const following = await api.isFollowing(id);
      setIsFollowing(following);
    } catch (error) {
      console.error('Failed to check follow status:', error);
    }
  };

  const handleFollowToggle = async () => {
    if (!id || !user) return;

    setIsFollowLoading(true);
    try {
      if (isFollowing) {
        await api.unfollowUser(id);
        setIsFollowing(false);
        setUser({ ...user, followersCount: user.followersCount - 1 });
      } else {
        await api.followUser(id);
        setIsFollowing(true);
        setUser({ ...user, followersCount: user.followersCount + 1 });
      }
    } catch (error: any) {
      console.error('Failed to toggle follow:', error);
      Alert.alert('오류', error.message || '팔로우 처리 중 오류가 발생했습니다.');
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handleFollowersPress = () => {
    if (id) {
      router.push(`/user/${id}/followers`);
    }
  };

  const handleFollowingPress = () => {
    if (id) {
      router.push(`/user/${id}/following`);
    }
  };

  const renderPost = ({ item }: { item: Post }) => (
    <TouchableOpacity
      style={styles.gridItem}
      onPress={() => router.push({
        pathname: '/asset-viewer',
        params: { postId: item.id }
      })}
    >
      <Image
        source={{ uri: item.imageUrl }}
        style={styles.gridImage}
      />
      {item.is3D && (
        <View style={styles.gridBadge}>
          <Text style={styles.gridBadgeText}>3D</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const isOwnProfile = currentUser?.id === id;

  if (isLoading || !user) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>프로필</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#1F2937" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{user.username}</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        numColumns={3}
        ListHeaderComponent={
          <View style={styles.profileHeader}>
            <Image
              source={{ uri: user.profileImage || 'https://cdn-luma.com/public/avatars/avatar-default.jpg' }}
              style={styles.profileImage}
            />
            <Text style={styles.username}>{user.username}</Text>
            {user.bio && <Text style={styles.bio}>{user.bio}</Text>}

            <View style={styles.stats}>
              <View style={styles.stat}>
                <Text style={styles.statNumber}>{user.postsCount}</Text>
                <Text style={styles.statLabel}>게시물</Text>
              </View>
              <TouchableOpacity style={styles.stat} onPress={handleFollowersPress}>
                <Text style={styles.statNumber}>{user.followersCount}</Text>
                <Text style={styles.statLabel}>팔로워</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.stat} onPress={handleFollowingPress}>
                <Text style={styles.statNumber}>{user.followingCount}</Text>
                <Text style={styles.statLabel}>팔로잉</Text>
              </TouchableOpacity>
            </View>

            {!isOwnProfile && (
              <TouchableOpacity
                style={[
                  styles.followButton,
                  isFollowing && styles.followingButton,
                ]}
                onPress={handleFollowToggle}
                disabled={isFollowLoading}
              >
                {isFollowLoading ? (
                  <ActivityIndicator size="small" color={isFollowing ? "#1F2937" : "#FFFFFF"} />
                ) : (
                  <Text
                    style={[
                      styles.followButtonText,
                      isFollowing && styles.followingButtonText,
                    ]}
                  >
                    {isFollowing ? '팔로잉' : '팔로우'}
                  </Text>
                )}
              </TouchableOpacity>
            )}

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>게시물</Text>
            </View>
          </View>
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="images-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>아직 게시물이 없습니다</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  profileHeader: {
    backgroundColor: '#FFFFFF',
    padding: 32,
    paddingBottom: 24,
    alignItems: 'center',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
    borderWidth: 3,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  username: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  bio: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  stats: {
    flexDirection: 'row',
    gap: 40,
    marginBottom: 24,
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -0.3,
  },
  statLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
    fontWeight: '500',
  },
  followButton: {
    backgroundColor: '#1F2937',
    paddingHorizontal: 48,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 32,
    minWidth: 120,
    alignItems: 'center',
  },
  followingButton: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  followButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  followingButtonText: {
    color: '#1F2937',
  },
  sectionHeader: {
    width: '100%',
    paddingTop: 20,
    paddingHorizontal: 20,
    borderTopWidth: 0.5,
    borderTopColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -0.3,
  },
  listContent: {
    flexGrow: 1,
    backgroundColor: '#FFFFFF',
  },
  gridItem: {
    flex: 1 / 3,
    aspectRatio: 1,
    padding: 0.5,
    position: 'relative',
  },
  gridImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F4F6',
  },
  gridBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  gridBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
    backgroundColor: '#FFFFFF',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
    backgroundColor: '#FFFFFF',
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
    fontWeight: '500',
  },
});
