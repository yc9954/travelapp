import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { api } from '../services/api';
import { lumaGalleryAssets } from '../services/mockData';

type EditMode = 'none' | 'removeBackground' | 'addText';

// 성운 에셋 찾기
const nebulaAsset = lumaGalleryAssets.find(asset => 
  asset.name.toLowerCase().includes('nebula') || 
  asset.captureUrl === 'https://lumalabs.ai/capture/b86b7928-f130-40a5-8cac-8095f30eed54'
);
const NEBULA_THUMBNAIL_URL = nebulaAsset?.thumbnail || '';
const NEBULA_CAPTURE_URL = nebulaAsset?.captureUrl || '';

export default function EditAssetScreen() {
  const params = useLocalSearchParams<{ imageUrl?: string; captureUrl?: string; isLuma?: string; isKiri?: string }>();
  const webViewRef = useRef<WebView>(null);

  const [imageUrl] = useState(params.imageUrl || '');
  const [captureUrl] = useState(params.captureUrl || '');
  const [isLuma] = useState(params.isLuma === 'true' || params.isKiri === 'true');

  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [hashtags, setHashtags] = useState('');

  // 편집 옵션
  const [removeBackground, setRemoveBackground] = useState(false);
  const [textOverlay, setTextOverlay] = useState('');
  const [textPosition, setTextPosition] = useState<'top' | 'center' | 'bottom'>('center');
  const [textColor, setTextColor] = useState('#ffffff');

  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showEditMenu, setShowEditMenu] = useState(false);

  // Three.js + Luma Web Library HTML
  const getLumaEditorHTML = () => {
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
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
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

    let splat = null;
    let currentSource = '${isLuma ? captureUrl : ''}';
    let backgroundRemoved = false;
    let textPlane = null;

    function loadSplat(source) {
      if (splat) {
        scene.remove(splat);
        splat = null;
      }

      if (!source) {
        console.log('No source provided');
        return;
      }

      splat = new LumaSplatsThree({
        source: source,
        enableThreeShaderIntegration: false,
        particleRevealEnabled: true,
      });

      splat.onLoad = () => {
        console.log('Splat loaded successfully');
        window.ReactNativeWebView?.postMessage(JSON.stringify({
          type: 'splatLoaded'
        }));
      };

      scene.add(splat);
    }

    // DemoHelloWorld.ts 방식: Canvas + Texture로 3D Text Mesh 생성
    function createText(text, position, color) {
      // create canvas
      const textCanvas = document.createElement('canvas');
      const context = textCanvas.getContext('2d');
      textCanvas.width = 1024;
      textCanvas.height = 512;

      // clear white, 0 alpha
      context.fillStyle = 'rgba(255, 255, 255, 0)';
      context.fillRect(0, 0, textCanvas.width, textCanvas.height);

      // draw text
      context.fillStyle = color || 'white';
      context.font = '200px sans-serif';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      // stroke
      context.strokeStyle = 'rgba(0, 0, 0, 0.5)';
      context.lineWidth = 5;
      context.fillText(text, textCanvas.width / 2, textCanvas.height / 2);
      context.strokeText(text, textCanvas.width / 2, textCanvas.height / 2);

      // create texture from canvas
      const texture = new Texture(textCanvas);
      texture.needsUpdate = true;

      // create plane geometry and mesh with the texture
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

      // position and rotate based on user selection
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

    // 배경 제거 토글
    window.toggleBackground = function() {
      if (!splat) return;

      backgroundRemoved = !backgroundRemoved;

      if (backgroundRemoved) {
        splat.semanticsMask = LumaSplatsSemantics.FOREGROUND;
      } else {
        splat.semanticsMask = LumaSplatsSemantics.FOREGROUND | LumaSplatsSemantics.BACKGROUND;
      }

      window.ReactNativeWebView?.postMessage(JSON.stringify({
        type: 'backgroundToggled',
        removed: backgroundRemoved
      }));
    };

    // 텍스트 Mesh 업데이트 (Luma 공식 방식)
    window.updateTextOverlay = function(text, position, color) {
      // 기존 텍스트 Mesh 제거
      if (textPlane) {
        scene.remove(textPlane);
        textPlane.geometry.dispose();
        textPlane.material.dispose();
        textPlane.material.map?.dispose();
        textPlane = null;
      }

      // 새 텍스트가 있으면 3D Mesh 생성 및 추가
      if (text) {
        textPlane = createText(text, position, color);
        scene.add(textPlane);
      }

      window.ReactNativeWebView?.postMessage(JSON.stringify({
        type: 'textUpdated',
        text: text
      }));
    };

    // 초기 로드
    if (currentSource) {
      loadSplat(currentSource);
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

    // React Native로 준비 완료 메시지 전송
    window.ReactNativeWebView?.postMessage(JSON.stringify({
      type: 'ready'
    }));
  </script>
</body>
</html>
    `;
  };

  const handleRemoveBackground = () => {
    if (!isLuma) {
      Alert.alert('Notice', 'Background removal is only available for Luma Gaussian Splatting assets.');
      return;
    }

    setIsProcessing(true);
    webViewRef.current?.injectJavaScript(`
      window.toggleBackground();
      true;
    `);

    setTimeout(() => {
      setRemoveBackground(!removeBackground);
      setIsProcessing(false);
      setShowEditMenu(false);
    }, 500);
  };

  const handleAddText = () => {
    if (!textOverlay.trim()) {
      Alert.alert('Notice', 'Please enter text.');
      return;
    }

    webViewRef.current?.injectJavaScript(`
      window.updateTextOverlay(
        ${JSON.stringify(textOverlay)},
        ${JSON.stringify(textPosition)},
        ${JSON.stringify(textColor)}
      );
      true;
    `);

    setShowEditMenu(false);
    Alert.alert('Success', 'Text has been added!');
  };

  const handlePost = async () => {
    if (!imageUrl || !caption) {
      Alert.alert('Error', 'Please enter an image and caption.');
      return;
    }

    setIsUploading(true);
    try {
      const hashtagArray = hashtags
        .split(' ')
        .filter(tag => tag.startsWith('#'))
        .map(tag => tag.substring(1));

      // 성운 에셋인지 확인 (captureUrl 또는 imageUrl로 판단)
      const isNebulaAsset = (captureUrl && captureUrl === NEBULA_CAPTURE_URL) || 
                           (imageUrl && (imageUrl === NEBULA_THUMBNAIL_URL || imageUrl.includes('Nebula_Gaussian_Splatting')));

      // 성운 에셋인 경우 성운 섬네일 URL 사용
      const finalImageUrl = isNebulaAsset ? NEBULA_THUMBNAIL_URL : imageUrl;

      await api.createPost({
        imageUrl: finalImageUrl,
        image3dUrl: isLuma ? captureUrl : undefined,
        is3D: isLuma,
        caption: caption,
        location: location || undefined,
        hashtags: hashtagArray,
        editMetadata: {
          textOverlay: textOverlay || undefined,
          textPosition: textPosition,
          textColor: textColor,
          removeBackground: removeBackground,
        },
      });

      Alert.alert('Success', 'Post uploaded successfully!');
      router.push('/(tabs)/feed');
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Error', 'Failed to upload post.');
    } finally {
      setIsUploading(false);
    }
  };

  const editOptions = [
    {
      id: 'removeBackground',
      title: removeBackground ? 'Restore Background' : 'Remove Background',
      icon: 'layers-outline' as const,
      description: 'Separate background with semantic layer filtering',
      onPress: handleRemoveBackground,
      disabled: !isLuma,
    },
    {
      id: 'addText',
      title: 'Add Text',
      icon: 'text-outline' as const,
      description: 'Add text overlay to 3D scene',
      onPress: () => {},
      disabled: false,
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Asset</Text>
        <TouchableOpacity onPress={() => setShowEditMenu(true)} style={styles.editButton}>
          <Ionicons name="create-outline" size={24} color="#6366F1" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* 3D 뷰어 */}
        <View style={styles.viewerContainer}>
          {isLuma ? (
            <WebView
              ref={webViewRef}
              source={{ html: getLumaEditorHTML() }}
              style={styles.webview}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              allowsInlineMediaPlayback={true}
              mediaPlaybackRequiresUserAction={false}
              onMessage={(event) => {
                try {
                  const data = JSON.parse(event.nativeEvent.data);
                  console.log('WebView message:', data);
                } catch (e) {
                  console.error('Failed to parse message:', e);
                }
              }}
            />
          ) : (
            <View style={styles.placeholder}>
              <Ionicons name="image" size={64} color="#9CA3AF" />
              <Text style={styles.placeholderText}>
                2D images can only be previewed
              </Text>
            </View>
          )}

          {isLuma && (
            <View style={styles.badge3D}>
              <Text style={styles.badge3DText}>3D</Text>
            </View>
          )}
        </View>

        {/* 편집 메뉴 */}
        <Modal
          visible={showEditMenu}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowEditMenu(false)}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Options</Text>
              <TouchableOpacity onPress={() => setShowEditMenu(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={editOptions}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.editOption,
                    item.disabled && styles.editOptionDisabled
                  ]}
                  onPress={() => {
                    if (item.id === 'addText') {
                      // 텍스트 입력 모드로 전환
                    } else {
                      item.onPress();
                    }
                  }}
                  disabled={item.disabled || isProcessing}
                >
                  <View style={styles.editOptionIcon}>
                    <Ionicons
                      name={item.icon}
                      size={24}
                      color={item.disabled ? '#9CA3AF' : '#6366F1'}
                    />
                  </View>
                  <View style={styles.editOptionContent}>
                    <Text style={[
                      styles.editOptionTitle,
                      item.disabled && styles.editOptionTitleDisabled
                    ]}>
                      {item.title}
                    </Text>
                    <Text style={styles.editOptionDescription}>
                      {item.description}
                    </Text>
                    {item.disabled && (
                      <Text style={styles.editOptionWarning}>
                        Luma asset only
                      </Text>
                    )}
                  </View>
                  {isProcessing && (
                    <ActivityIndicator size="small" color="#6366F1" />
                  )}
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.editOptionsList}
            />

            {/* Text overlay input section */}
            <View style={styles.textInputSection}>
              <Text style={styles.sectionTitle}>Text Overlay</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter text to add..."
                placeholderTextColor="#9CA3AF"
                value={textOverlay}
                onChangeText={setTextOverlay}
                multiline
              />
              <View style={styles.textPositionSelector}>
                <Text style={styles.textPositionLabel}>Position:</Text>
                {(['top', 'center', 'bottom'] as const).map((pos) => (
                  <TouchableOpacity
                    key={pos}
                    style={[
                      styles.textPositionButton,
                      textPosition === pos && styles.textPositionButtonActive,
                    ]}
                    onPress={() => setTextPosition(pos)}
                  >
                    <Text
                      style={[
                        styles.textPositionButtonText,
                        textPosition === pos && styles.textPositionButtonTextActive,
                      ]}
                    >
                      {pos === 'top' ? 'Top' : pos === 'center' ? 'Center' : 'Bottom'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity
                style={styles.addTextButton}
                onPress={handleAddText}
                disabled={!textOverlay.trim()}
              >
                <Text style={styles.addTextButtonText}>Apply Text</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Modal>

        {/* Post information input */}
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Enter caption..."
            placeholderTextColor="#9CA3AF"
            value={caption}
            onChangeText={setCaption}
            multiline
            numberOfLines={3}
          />

          <TextInput
            style={styles.input}
            placeholder="Location (e.g., Paris, France)"
            placeholderTextColor="#9CA3AF"
            value={location}
            onChangeText={setLocation}
          />

          <TextInput
            style={styles.input}
            placeholder="Hashtags (e.g., #GaussianSplatting #3D)"
            placeholderTextColor="#9CA3AF"
            value={hashtags}
            onChangeText={setHashtags}
          />

          {isLuma && (
            <View style={styles.lumaInfo}>
              <Ionicons name="information-circle-outline" size={24} color="#6366F1" />
              <Text style={styles.lumaInfoText}>
                This is a Luma Gaussian Splatting asset. You can rotate and edit it 360 degrees.
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.postButton, isUploading && styles.disabledButton]}
            onPress={handlePost}
            disabled={isUploading}
          >
            {isUploading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.postButtonText}>Post</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -0.3,
  },
  editButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  viewerContainer: {
    height: 400,
    position: 'relative',
    backgroundColor: '#000000',
  },
  webview: {
    flex: 1,
    backgroundColor: '#000000',
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1F2937',
  },
  placeholderText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 12,
  },
  badge3D: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  badge3DText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -0.3,
  },
  editOptionsList: {
    padding: 20,
  },
  editOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  editOptionDisabled: {
    opacity: 0.5,
  },
  editOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  editOptionContent: {
    flex: 1,
  },
  editOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  editOptionTitleDisabled: {
    color: '#9CA3AF',
  },
  editOptionDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  editOptionWarning: {
    fontSize: 12,
    color: '#F59E0B',
    marginTop: 4,
  },
  textInputSection: {
    padding: 20,
    borderTopWidth: 0.5,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  textInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 12,
    borderWidth: 0.5,
    borderColor: '#E5E7EB',
    minHeight: 80,
  },
  textPositionSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  textPositionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginRight: 12,
  },
  textPositionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    borderWidth: 0.5,
    borderColor: '#E5E7EB',
    marginRight: 8,
  },
  textPositionButtonActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  textPositionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  textPositionButtonTextActive: {
    color: '#FFFFFF',
  },
  addTextButton: {
    backgroundColor: '#1F2937',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  addTextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  form: {
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 12,
    borderWidth: 0.5,
    borderColor: '#E5E7EB',
  },
  lumaInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  lumaInfoText: {
    flex: 1,
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  postButton: {
    backgroundColor: '#1F2937',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  postButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
});
