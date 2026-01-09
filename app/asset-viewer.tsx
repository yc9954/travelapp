import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  FlatList,
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import type { Post, Comment } from '../types';

export default function AssetViewerScreen() {
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const { user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    if (postId) {
      loadPost();
      loadComments();
    }
  }, [postId]);

  const loadPost = async () => {
    try {
      const posts = await api.getFeed();
      const foundPost = posts.find(p => p.id === postId);
      if (foundPost) {
        setPost(foundPost);
      }
    } catch (error) {
      console.error('Failed to load post:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadComments = async () => {
    if (!postId) return;
    setIsLoadingComments(true);
    try {
      const data = await api.getComments(postId);
      setComments(data);
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handleLike = async () => {
    if (!post) return;
    try {
      if (post.isLiked) {
        await api.unlikePost(post.id);
        setPost({ ...post, isLiked: false, likesCount: post.likesCount - 1 });
      } else {
        await api.likePost(post.id);
        setPost({ ...post, isLiked: true, likesCount: post.likesCount + 1 });
      }
    } catch (error) {
      console.error('Failed to toggle like:', error);
    }
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim() || !postId || isSubmittingComment) return;

    setIsSubmittingComment(true);
    try {
      const newComment = await api.createComment(postId, commentText.trim());
      setComments([newComment, ...comments]);
      setCommentText('');
      if (post) {
        setPost({ ...post, commentsCount: post.commentsCount + 1 });
      }
    } catch (error) {
      console.error('Failed to create comment:', error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const getLumaEmbedUrl = (lumaUrl: string): string => {
    // Luma AI capture URL에서 UUID 추출
    // 형식: https://lumalabs.ai/capture/{uuid}
    // 또는: https://lumalabs.ai/luma-web-library/{id}
    try {
      const url = new URL(lumaUrl);
      const pathParts = url.pathname.split('/').filter(Boolean);
      
      let captureId: string | undefined;
      
      if (url.hostname.includes('lumalabs.ai')) {
        // https://lumalabs.ai/capture/{uuid} 형식
        const captureIndex = pathParts.indexOf('capture');
        if (captureIndex >= 0 && pathParts.length > captureIndex + 1) {
          captureId = pathParts[captureIndex + 1];
        } else {
          // luma-web-library 형식
          const libraryIndex = pathParts.indexOf('luma-web-library');
          if (libraryIndex >= 0 && pathParts.length > libraryIndex + 1) {
            captureId = pathParts[libraryIndex + 1];
          } else {
            // 마지막 경로 요소를 ID로 사용
            captureId = pathParts[pathParts.length - 1];
          }
        }
      } else if (url.hostname.includes('captures.lumalabs.ai')) {
        // https://captures.lumalabs.ai/{id} 또는 https://captures.lumalabs.ai/embed/{id} 형식
        const embedIndex = pathParts.indexOf('embed');
        if (embedIndex >= 0 && pathParts.length > embedIndex + 1) {
          // 이미 embed URL인 경우
          return lumaUrl;
        }
        captureId = pathParts[pathParts.length - 1];
      }
      
      if (captureId && captureId !== 'embed' && captureId !== 'capture') {
        // Luma AI embed URL 형식으로 변환
        return `https://captures.lumalabs.ai/embed/${captureId}?mode=slf&background=%23ffffff&color=%23000000&showTitle=false&loadBg=true&logoPosition=bottom-left&infoPosition=bottom-right&cinematicVideo=false&showMenu=false`;
      }
    } catch (e) {
      console.error('Failed to parse Luma URL:', e);
    }
    
    // URL 파싱 실패 시 원본 URL 반환 (이미 embed URL일 수도 있음)
    return lumaUrl;
  };

  const renderComment = ({ item }: { item: Comment }) => (
    <View style={styles.commentItem}>
      <Image
        source={{ uri: item.user.profileImage || 'https://via.placeholder.com/40' }}
        style={styles.commentAvatar}
      />
      <View style={styles.commentContent}>
        <View style={styles.commentHeader}>
          <Text style={styles.commentUsername}>{item.user.username}</Text>
          <Text style={styles.commentTime}>
            {new Date(item.createdAt).toLocaleDateString('ko-KR', {
              month: 'short',
              day: 'numeric',
            })}
          </Text>
        </View>
        <Text style={styles.commentText}>{item.content}</Text>
      </View>
    </View>
  );

  if (isLoading || !post) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  const is3D = post.is3D && post.image3dUrl;
  const embedUrl = is3D ? getLumaEmbedUrl(post.image3dUrl) : null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {post.user.username}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.viewerContainer}>
        {is3D && embedUrl ? (
          <WebView
            ref={webViewRef}
            source={{ uri: embedUrl }}
            style={styles.webview}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            renderLoading={() => (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6366F1" />
              </View>
            )}
          />
        ) : (
          <Image
            source={{ uri: post.imageUrl }}
            style={styles.image}
            resizeMode="contain"
          />
        )}
      </View>

      <View style={styles.actions}>
        <View style={styles.leftActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleLike}
            activeOpacity={0.7}
          >
            <Ionicons
              name={post.isLiked ? 'heart' : 'heart-outline'}
              size={28}
              color={post.isLiked ? '#EF4444' : '#1F2937'}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowComments(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="chatbubble-outline" size={26} color="#1F2937" />
          </TouchableOpacity>
        </View>
        <Text style={styles.likesCount}>{post.likesCount.toLocaleString()}</Text>
      </View>

      <View style={styles.captionContainer}>
        <View style={styles.captionHeader}>
          <Text style={styles.captionUsername}>{post.user.username}</Text>
          {post.location && (
            <View style={styles.locationContainer}>
              <Ionicons name="location-outline" size={14} color="#6B7280" />
              <Text style={styles.location}>{post.location}</Text>
            </View>
          )}
        </View>
        <Text style={styles.caption}>{post.caption}</Text>
        {post.hashtags.length > 0 && (
          <Text style={styles.hashtags}>
            {post.hashtags.map(tag => `#${tag}`).join(' ')}
          </Text>
        )}
        {post.commentsCount > 0 && (
          <TouchableOpacity onPress={() => setShowComments(true)}>
            <Text style={styles.viewComments}>
              댓글 {post.commentsCount}개 모두 보기
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={styles.commentInputContainer}>
          <Image
            source={{ uri: user?.profileImage || 'https://via.placeholder.com/32' }}
            style={styles.inputAvatar}
          />
          <TextInput
            style={styles.commentInput}
            placeholder="댓글을 입력하세요..."
            placeholderTextColor="#9CA3AF"
            value={commentText}
            onChangeText={setCommentText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            onPress={handleSubmitComment}
            disabled={!commentText.trim() || isSubmittingComment}
            style={[
              styles.submitButton,
              (!commentText.trim() || isSubmittingComment) && styles.submitButtonDisabled,
            ]}
          >
            {isSubmittingComment ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="send" size={20} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <Modal
        visible={showComments}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowComments(false)}
      >
        <SafeAreaView style={styles.modalContainer} edges={['top']}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>댓글</Text>
            <TouchableOpacity onPress={() => setShowComments(false)}>
              <Ionicons name="close" size={24} color="#1F2937" />
            </TouchableOpacity>
          </View>
          {isLoadingComments ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color="#6366F1" />
            </View>
          ) : (
            <FlatList
              data={comments}
              renderItem={renderComment}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.commentsList}
              ListEmptyComponent={
                <View style={styles.emptyComments}>
                  <Ionicons name="chatbubble-outline" size={48} color="#9CA3AF" />
                  <Text style={styles.emptyCommentsText}>아직 댓글이 없습니다</Text>
                </View>
              }
            />
          )}
        </SafeAreaView>
      </Modal>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 32,
  },
  viewerContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  webview: {
    flex: 1,
    backgroundColor: '#000000',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    marginRight: 16,
  },
  likesCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  captionContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  captionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  captionUsername: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  location: {
    fontSize: 14,
    color: '#6B7280',
  },
  caption: {
    fontSize: 14,
    color: '#1F2937',
    lineHeight: 20,
    marginBottom: 8,
  },
  hashtags: {
    fontSize: 14,
    color: '#3B82F6',
    marginBottom: 8,
  },
  viewComments: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    gap: 12,
  },
  inputAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1F2937',
    maxHeight: 100,
  },
  submitButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  commentsList: {
    padding: 16,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  commentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  commentUsername: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  commentTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  commentText: {
    fontSize: 14,
    color: '#1F2937',
    lineHeight: 20,
  },
  emptyComments: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyCommentsText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 16,
  },
});
