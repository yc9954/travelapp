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

  const getLuma3DViewerHTML = () => {
    if (!post || !post.is3D || !post.image3dUrl) return '';

    const metadata = post.editMetadata || {};
    const textOverlay = metadata.textOverlay || '';
    const textPosition = metadata.textPosition || 'center';
    const textColor = metadata.textColor || '#ffffff';
    const removeBackground = metadata.removeBackground || false;

    return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      overflow: hidden;
      background: #000;
    }
    canvas {
      display: block;
      width: 100vw;
      height: 100vh;
    }
  </style>
</head>
<body>
  <canvas id="canvas"></canvas>

  <script type="importmap">
  {
    "imports": {
      "three": "https://unpkg.com/three@0.157.0/build/three.module.js",
      "three/addons/": "https://unpkg.com/three@0.157.0/examples/jsm/",
      "@lumaai/luma-web": "https://unpkg.com/@lumaai/luma-web@0.2.0/dist/library/luma-web.module.js"
    }
  }
  </script>

  <script type="module">
    import {
      WebGLRenderer,
      PerspectiveCamera,
      Scene,
      Color,
      Texture,
      PlaneGeometry,
      MeshStandardMaterial,
      Mesh,
      DoubleSide
    } from 'three';
    import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
    import { LumaSplatsThree, LumaSplatsSemantics } from '@lumaai/luma-web';

    const canvas = document.getElementById('canvas');

    const renderer = new WebGLRenderer({
      canvas: canvas,
      antialias: false,
      alpha: true
    });

    renderer.setSize(window.innerWidth, window.innerHeight, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new Scene();
    scene.background = new Color('black');

    const camera = new PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 2);

    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enablePan = true;
    controls.enableZoom = true;

    // Splat 로드
    const splat = new LumaSplatsThree({
      source: '${post.image3dUrl}',
      enableThreeShaderIntegration: false,
      particleRevealEnabled: true,
    });

    // 배경 제거 적용
    if (${removeBackground}) {
      splat.semanticsMask = LumaSplatsSemantics.FOREGROUND;
    }

    scene.add(splat);

    // DemoHelloWorld.ts 방식: Canvas + Texture로 3D Text Mesh 생성
    function createText(text, position, color) {
      const textCanvas = document.createElement('canvas');
      const context = textCanvas.getContext('2d');
      textCanvas.width = 1024;
      textCanvas.height = 512;

      context.fillStyle = 'rgba(255, 255, 255, 0)';
      context.fillRect(0, 0, textCanvas.width, textCanvas.height);

      context.fillStyle = color || 'white';
      context.font = '200px sans-serif';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.strokeStyle = 'rgba(0, 0, 0, 0.5)';
      context.lineWidth = 5;
      context.fillText(text, textCanvas.width / 2, textCanvas.height / 2);
      context.strokeText(text, textCanvas.width / 2, textCanvas.height / 2);

      const texture = new Texture(textCanvas);
      texture.needsUpdate = true;

      const geometry = new PlaneGeometry(5, 2.5);
      const material = new MeshStandardMaterial({
        map: texture,
        transparent: false,
        alphaTest: 0.5,
        side: DoubleSide,
        premultipliedAlpha: true,
        emissive: color || 'white',
        emissiveIntensity: 2,
      });
      const textPlane = new Mesh(geometry, material);

      let yPos = -0.9;
      if (position === 'top') {
        yPos = 0.9;
      } else if (position === 'center') {
        yPos = 0;
      } else if (position === 'bottom') {
        yPos = -0.9;
      }

      textPlane.position.set(0.8, yPos, 0);
      textPlane.rotation.y = Math.PI / 2;
      textPlane.scale.setScalar(0.6);

      return textPlane;
    }

    // 텍스트 오버레이 적용
    const textOverlay = '${textOverlay.replace(/'/g, "\\'")}';
    if (textOverlay) {
      const textMesh = createText(textOverlay, '${textPosition}', '${textColor}');
      scene.add(textMesh);
    }

    // 애니메이션 루프
    function animate() {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    // 리사이즈 핸들러
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight, false);
    });

    window.ReactNativeWebView?.postMessage(JSON.stringify({
      type: 'ready'
    }));
  </script>
</body>
</html>
    `;
  };

  const renderComment = ({ item }: { item: Comment }) => (
    <View style={styles.commentItem}>
      <Image
        source={{ uri: item.user.profileImage || 'https://cdn-luma.com/public/avatars/avatar-default.jpg' }}
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

  return (
    <View style={styles.container}>
      {/* 3D 뷰어 (전체 화면) */}
      <View style={styles.viewerContainer}>
        {is3D ? (
          <WebView
            ref={webViewRef}
            source={{ html: getLuma3DViewerHTML() }}
            style={styles.webview}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={false}
          />
        ) : (
          <Image
            source={{ uri: post.imageUrl }}
            style={styles.image}
            resizeMode="contain"
          />
        )}
      </View>

      {/* 투명 헤더 */}
      <SafeAreaView style={styles.transparentHeader} edges={['top']}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <View style={styles.headerButtonBackground}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
        <Text style={styles.headerUsername} numberOfLines={1}>
          {post.user.username}
        </Text>
        <View style={styles.headerPlaceholder} />
      </SafeAreaView>

      {/* 투명 하단 UI */}
      <SafeAreaView style={styles.transparentBottom} edges={['bottom']}>
        {/* 액션 버튼 */}
        <View style={styles.actionsOverlay}>
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.actionButtonOverlay}
              onPress={handleLike}
              activeOpacity={0.7}
            >
              <View style={styles.actionButtonBackground}>
                <Ionicons
                  name={post.isLiked ? 'heart' : 'heart-outline'}
                  size={28}
                  color={post.isLiked ? '#EF4444' : '#FFFFFF'}
                />
                <Text style={styles.actionText}>{post.likesCount}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButtonOverlay}
              onPress={() => setShowComments(true)}
              activeOpacity={0.7}
            >
              <View style={styles.actionButtonBackground}>
                <Ionicons name="chatbubble-outline" size={26} color="#FFFFFF" />
                <Text style={styles.actionText}>{post.commentsCount}</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* 캡션 */}
          <View style={styles.captionOverlay}>
            <Text style={styles.captionUsernameOverlay}>{post.user.username}</Text>
            <Text style={styles.captionTextOverlay} numberOfLines={2}>
              {post.caption}
            </Text>
            {post.hashtags.length > 0 && (
              <Text style={styles.hashtagsOverlay} numberOfLines={1}>
                {post.hashtags.map(tag => `#${tag}`).join(' ')}
              </Text>
            )}
          </View>
        </View>

        {/* 댓글 입력 */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <View style={styles.commentInputOverlay}>
            <Image
              source={{ uri: user?.profileImage || 'https://cdn-luma.com/public/avatars/avatar-default.jpg' }}
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
      </SafeAreaView>

      {/* 댓글 모달 */}
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
  viewerContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  webview: {
    flex: 1,
    backgroundColor: '#000000',
  },
  image: {
    width: '100%',
    height: '100%',
  },

  // 투명 헤더
  transparentHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'transparent',
  },
  headerButton: {
    padding: 4,
  },
  headerButtonBackground: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerUsername: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  headerPlaceholder: {
    width: 48,
  },

  // 투명 하단 UI
  transparentBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
  },
  actionsOverlay: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionButtonOverlay: {
    marginRight: 20,
  },
  actionButtonBackground: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  captionOverlay: {
    marginTop: 8,
  },
  captionUsernameOverlay: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  captionTextOverlay: {
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 20,
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  hashtagsOverlay: {
    fontSize: 14,
    color: '#60A5FA',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  // 댓글 입력
  commentInputOverlay: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    gap: 12,
  },
  inputAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  commentInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: '#FFFFFF',
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
    backgroundColor: '#4B5563',
  },

  // 댓글 모달
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
