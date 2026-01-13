import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Post } from '../types';

interface PostCardProps {
  post: Post;
  onLike: (postId: string) => void;
  onComment: (postId: string) => void;
  onViewPost: (postId: string) => void;
}

export function PostCard({ post, onLike, onComment, onViewPost }: PostCardProps) {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Image
            source={{ uri: post.user.profileImage || 'https://cdn-luma.com/public/avatars/avatar-default.jpg' }}
            style={styles.avatar}
          />
          <View>
            <Text style={styles.username}>{post.user.username}</Text>
            {post.location && (
              <Text style={styles.location}>{post.location}</Text>
            )}
          </View>
        </View>
      </View>

      <TouchableOpacity activeOpacity={0.9} onPress={() => onViewPost(post.id)}>
        <View style={styles.imageContainer}>
          {imageLoading && !imageError && (
            <View style={styles.imageLoadingContainer}>
              <ActivityIndicator size="large" color="#60A5FA" />
            </View>
          )}
          {imageError ? (
            <View style={styles.imageErrorContainer}>
              <Ionicons name="image-outline" size={64} color="#9CA3AF" />
              <Text style={styles.imageErrorText}>이미지를 불러올 수 없습니다</Text>
            </View>
          ) : (
            <Image
              source={{ uri: post.imageUrl }}
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
          {post.is3D && !imageError && (
            <View style={styles.badge3DContainer}>
              <View style={styles.badge3D}>
                <Ionicons name="cube-outline" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                <Text style={styles.badge3DText}>3D</Text>
              </View>
            </View>
          )}
        </View>
      </TouchableOpacity>

      <View style={styles.actions}>
        <View style={styles.leftActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onLike(post.id)}
          >
            <Ionicons
              name={post.isLiked ? 'heart' : 'heart-outline'}
              size={28}
              color={post.isLiked ? '#EF4444' : '#1F2937'}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onComment(post.id)}
          >
            <Ionicons name="chatbubble-outline" size={26} color="#1F2937" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="paper-plane-outline" size={26} color="#1F2937" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.likes}>{post.likesCount.toLocaleString()}개의 좋아요</Text>
        <View style={styles.caption}>
          <Text style={styles.username}>{post.user.username}</Text>
          <Text style={styles.captionText}> {post.caption}</Text>
        </View>
        {post.hashtags.length > 0 && (
          <Text style={styles.hashtags}>
            {post.hashtags.map(tag => `#${tag}`).join(' ')}
          </Text>
        )}
        {post.commentsCount > 0 && (
          <TouchableOpacity onPress={() => onComment(post.id)}>
            <Text style={styles.viewComments}>
              댓글 {post.commentsCount}개 모두 보기
            </Text>
          </TouchableOpacity>
        )}
        <Text style={styles.timestamp}>
          {new Date(post.createdAt).toLocaleDateString('ko-KR')}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#F3F4F6',
  },
  username: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  location: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  badge3DContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  badge3D: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  badge3DText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  imageContainer: {
    width: '100%',
    height: 400,
    backgroundColor: '#F3F4F6',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageLoadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  imageErrorContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  imageErrorText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6B7280',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  leftActions: {
    flexDirection: 'row',
  },
  actionButton: {
    marginRight: 16,
  },
  content: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  likes: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  caption: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  captionText: {
    fontSize: 14,
    color: '#1F2937',
    flex: 1,
  },
  hashtags: {
    fontSize: 14,
    color: '#3B82F6',
    marginBottom: 4,
  },
  viewComments: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});
