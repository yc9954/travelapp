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
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
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
        source={{ uri: item.imageUrl }}
        style={styles.gridImage}
      />
    </View>
  );

  if (!user) return null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#6B7280" />
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
              source={{ uri: user.profileImage || 'https://cdn-luma.com/public/avatars/avatar-default.jpg' }}
              style={styles.profileImage}
            />
            <View style={styles.usernameContainer}>
              <Text style={styles.username}>{user.username}</Text>
              {user.followersCount >= 5000 && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={20} color="#3B82F6" />
                </View>
              )}
            </View>
            {user.bio && <Text style={styles.bio}>{user.bio}</Text>}

            <View style={styles.stats}>
              <View style={styles.stat}>
                <Text style={styles.statNumber}>{user.postsCount}</Text>
                <Text style={styles.statLabel}>Posts</Text>
              </View>
              <TouchableOpacity
                style={styles.stat}
                onPress={() => router.push(`/user/${user.id}/followers`)}
              >
                <Text style={styles.statNumber}>{user.followersCount}</Text>
                <Text style={styles.statLabel}>Followers</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.stat}
                onPress={() => router.push(`/user/${user.id}/following`)}
              >
                <Text style={styles.statNumber}>{user.followingCount}</Text>
                <Text style={styles.statLabel}>Following</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.editButton}>
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>My Posts</Text>
            </View>
          </View>
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color="#1F2937" />
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="images-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyText}>No posts yet</Text>
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={() => router.push('/(tabs)/upload')}
              >
                <Text style={styles.uploadButtonText}>Upload First Post</Text>
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
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -0.5,
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
  usernameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    gap: 6,
  },
  username: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -0.5,
  },
  verifiedBadge: {
    marginLeft: 4,
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
  editButton: {
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  editButtonText: {
    fontSize: 15,
    fontWeight: '600',
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
    marginBottom: 24,
    fontWeight: '500',
  },
  uploadButton: {
    backgroundColor: '#1F2937',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  uploadButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
