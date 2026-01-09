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
import { router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import type { Post } from '../../types';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadUserPosts();
    }
  }, [user]);

  const loadUserPosts = async () => {
    if (!user) return;

    try {
      const data = await api.getUserPosts(user.id);
      setPosts(data);
    } catch (error) {
      console.error('Failed to load user posts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      '로그아웃',
      '정말 로그아웃하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '로그아웃',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const renderPost = ({ item }: { item: Post }) => (
    <View style={styles.gridItem}>
      <Image
        source={{ uri: item.is3D ? item.image3dUrl : item.imageUrl }}
        style={styles.gridImage}
      />
      {item.is3D && (
        <View style={styles.gridBadge}>
          <Text style={styles.gridBadgeText}>3D</Text>
        </View>
      )}
    </View>
  );

  if (!user) return null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>프로필</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#1F2937" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        numColumns={3}
        ListHeaderComponent={
          <View style={styles.profileHeader}>
            <Image
              source={{ uri: user.profileImage || 'https://via.placeholder.com/100' }}
              style={styles.profileImage}
            />
            <Text style={styles.username}>{user.username}</Text>
            {user.bio && <Text style={styles.bio}>{user.bio}</Text>}

            <View style={styles.stats}>
              <View style={styles.stat}>
                <Text style={styles.statNumber}>{user.postsCount}</Text>
                <Text style={styles.statLabel}>게시물</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statNumber}>{user.followersCount}</Text>
                <Text style={styles.statLabel}>팔로워</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statNumber}>{user.followingCount}</Text>
                <Text style={styles.statLabel}>팔로잉</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.editButton}>
              <Text style={styles.editButtonText}>프로필 편집</Text>
            </TouchableOpacity>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>내 게시물</Text>
            </View>
          </View>
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color="#6366F1" />
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="images-outline" size={64} color="#9CA3AF" />
              <Text style={styles.emptyText}>아직 게시물이 없습니다</Text>
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={() => router.push('/(tabs)/upload')}
              >
                <Text style={styles.uploadButtonText}>첫 게시물 올리기</Text>
              </TouchableOpacity>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  profileHeader: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  bio: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  stats: {
    flexDirection: 'row',
    gap: 32,
    marginBottom: 24,
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  editButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 32,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 24,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  sectionHeader: {
    width: '100%',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  listContent: {
    flexGrow: 1,
  },
  gridItem: {
    flex: 1 / 3,
    aspectRatio: 1,
    padding: 1,
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
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 24,
  },
  uploadButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  uploadButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
