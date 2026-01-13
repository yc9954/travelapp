import React, { useState, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
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
  const webViewRef = useRef<WebView>(null);

  const getLuma3DViewerHTML = () => {
    if (!post.is3D || !post.image3dUrl) return '';

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
    body { overflow: hidden; background: #000; }
    canvas { display: block; width: 100vw; height: 100vh; }
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
    import { WebGLRenderer, PerspectiveCamera, Scene, Color, Texture, PlaneGeometry, MeshStandardMaterial, Mesh, DoubleSide } from 'three';
    import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
    import { LumaSplatsThree, LumaSplatsSemantics } from '@lumaai/luma-web';

    const canvas = document.getElementById('canvas');
    const renderer = new WebGLRenderer({ canvas, antialias: false, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new Scene();
    scene.background = new Color('black');

    const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 2);

    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enablePan = true;
    controls.enableZoom = true;

    const splat = new LumaSplatsThree({
      source: '${post.image3dUrl}',
      enableThreeShaderIntegration: false,
      particleRevealEnabled: true,
    });

    if (${removeBackground}) {
      splat.semanticsMask = LumaSplatsSemantics.FOREGROUND;
    }

    scene.add(splat);

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

      let yPos = position === 'top' ? 0.9 : position === 'bottom' ? -0.9 : 0;
      textPlane.position.set(0.8, yPos, 0);
      textPlane.rotation.y = Math.PI / 2;
      textPlane.scale.setScalar(0.6);
      return textPlane;
    }

    const textOverlay = '${textOverlay.replace(/'/g, "\\'")}';
    if (textOverlay) {
      scene.add(createText(textOverlay, '${textPosition}', '${textColor}'));
    }

    function animate() {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight, false);
    });

    window.ReactNativeWebView?.postMessage(JSON.stringify({ type: 'ready' }));
  </script>
</body>
</html>
    `;
  };

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
          ) : post.is3D && post.image3dUrl ? (
            <WebView
              ref={webViewRef}
              source={{ html: getLuma3DViewerHTML() }}
              style={styles.image}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              allowsInlineMediaPlayback={true}
              mediaPlaybackRequiresUserAction={false}
              onLoadEnd={() => setImageLoading(false)}
              onError={() => {
                setImageLoading(false);
                setImageError(true);
              }}
              scrollEnabled={false}
              bounces={false}
            />
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
  badge3D: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
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
