import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import type { Post } from '../types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_HEIGHT = SCREEN_HEIGHT * 0.45; // 45% of screen height

interface InteractiveSceneCardProps {
  post: Post;
}

export function InteractiveSceneCard({ post }: InteractiveSceneCardProps) {
  const [isLoading, setIsLoading] = useState(true);

  const getLuma3DViewerHTML = () => {
    const textOverlay = post.editMetadata?.textOverlay || '';
    const textPosition = post.editMetadata?.textPosition || 'center';
    const textColor = post.editMetadata?.textColor || '#FFFFFF';
    const removeBackground = post.editMetadata?.removeBackground || false;

    let textPositionY = 0;
    if (textPosition === 'top') textPositionY = 2;
    else if (textPosition === 'center') textPositionY = 0;
    else if (textPosition === 'bottom') textPositionY = -2;

    const semanticsFilter = removeBackground
      ? `splat.semanticsMask = LumaSplatsSemantics.FOREGROUND;`
      : '';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; }
    body { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
    #canvas-container { width: 100%; height: 100%; position: relative; }
    canvas { display: block; width: 100%; height: 100%; touch-action: none; }
  </style>
</head>
<body>
  <div id="canvas-container"></div>
  <script type="importmap">
    {
      "imports": {
        "three": "https://unpkg.com/three@0.157.0/build/three.module.js",
        "three/examples/jsm/controls/OrbitControls": "https://unpkg.com/three@0.157.0/examples/jsm/controls/OrbitControls.js",
        "@lumaai/luma-web": "https://unpkg.com/@lumaai/luma-web@0.2.0/dist/library/luma-web.module.js"
      }
    }
  </script>
  <script type="module">
    import * as THREE from 'three';
    import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
    import { LumaSplatsThree, LumaSplatsSemantics } from '@lumaai/luma-web';

    let scene = new THREE.Scene();
    let camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 2;

    let renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    document.getElementById('canvas-container').appendChild(renderer.domElement);

    let controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;
    controls.enableZoom = true;
    controls.zoomSpeed = 1.0;
    controls.minDistance = 0.5;
    controls.maxDistance = 10;

    let splat = new LumaSplatsThree({
      source: '${post.captureUrl || 'https://lumalabs.ai/capture/ca9ea966-ca24-4ec1-ab0f-af665cb546ff'}',
      enableThreeShaderIntegration: false,
    });
    ${semanticsFilter}
    scene.add(splat);

    ${textOverlay ? `
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '${textColor}';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('${textOverlay}', 256, 64);

    const texture = new THREE.CanvasTexture(canvas);
    const textMaterial = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide
    });
    const textGeometry = new THREE.PlaneGeometry(3, 0.75);
    const textMesh = new THREE.Mesh(textGeometry, textMaterial);
    textMesh.position.set(0, ${textPositionY}, 0.5);
    scene.add(textMesh);
    ` : ''}

    function animate() {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    }

    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    animate();
  </script>
</body>
</html>
    `;
  };

  return (
    <View style={styles.container}>
      <WebView
        source={{ html: getLuma3DViewerHTML() }}
        style={styles.webview}
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => setIsLoading(false)}
        scrollEnabled={false}
        bounces={false}
        scalesPageToFit={true}
        javaScriptEnabled={true}
      />

      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>
      )}

      <View style={styles.overlay}>
        <View style={styles.badge}>
          <Ionicons name="sparkles" size={16} color="#FFFFFF" />
          <Text style={styles.badgeText}>Interactive Scenes</Text>
        </View>

        <View style={styles.info}>
          <Text style={styles.title}>{post.location || 'Interactive 3D Scene'}</Text>
          <Text style={styles.subtitle}>
            Capture with Luma and share in lifelike interactive 3D, anywhere and with everyone.
          </Text>
        </View>

        <View style={styles.pagination}>
          <View style={styles.dot} />
          <View style={[styles.dot, styles.dotActive]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    height: CARD_HEIGHT,
    position: 'relative',
    backgroundColor: '#000000',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    paddingBottom: 32,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
    gap: 6,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  info: {
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 15,
    color: '#FFFFFF',
    lineHeight: 22,
    opacity: 0.9,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  dotActive: {
    backgroundColor: '#FFFFFF',
  },
});
