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

type EditMode = 'none' | 'removeBackground' | 'addText';

export default function EditAssetScreen() {
  const params = useLocalSearchParams<{ imageUrl?: string; captureUrl?: string; isLuma?: string }>();
  const webViewRef = useRef<WebView>(null);

  const [imageUrl] = useState(params.imageUrl || '');
  const [captureUrl] = useState(params.captureUrl || '');
  const [isLuma] = useState(params.isLuma === 'true');

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
    #textOverlay {
      position: absolute;
      transform: translate(-50%, -50%);
      padding: 16px 24px;
      background: rgba(0, 0, 0, 0.7);
      border-radius: 8px;
      color: white;
      font-size: 20px;
      font-weight: 600;
      text-align: center;
      pointer-events: none;
      display: none;
      max-width: 80%;
      word-wrap: break-word;
      white-space: nowrap;
    }
  </style>
</head>
<body>
  <canvas id="canvas"></canvas>
  <div id="textOverlay"></div>

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
    import { WebGLRenderer, PerspectiveCamera, Scene, Color, Vector3 } from 'three';
    import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
    import { LumaSplatsThree, LumaSplatsSemantics } from '@lumaai/luma-web';

    const canvas = document.getElementById('canvas');
    const textOverlay = document.getElementById('textOverlay');

    const renderer = new WebGLRenderer({
      canvas: canvas,
      antialias: false,
      alpha: true
    });

    renderer.setSize(window.innerWidth, window.innerHeight, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new Scene();
    scene.background = new Color(0x000000);

    const camera = new PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 2;

    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enablePan = true;
    controls.enableZoom = true;

    let splat = null;
    let currentSource = '${isLuma ? captureUrl : ''}';
    let backgroundRemoved = false;

    // 3D 공간에서 텍스트가 고정될 위치 (월드 좌표)
    const labelPosition = new Vector3(0, 0, 0);
    let textEnabled = false;
    let currentTextPosition = 'center';

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
        loadingAnimationEnabled: true,
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

    // 3D 좌표를 화면 좌표로 투영하여 HTML 위치 업데이트
    function updateLabelPosition() {
      if (!textEnabled) return;

      // 3D 월드 좌표를 카메라 기준으로 투영
      const projected = labelPosition.clone();
      projected.project(camera);

      // NDC 좌표 (-1 ~ 1)를 화면 픽셀 좌표로 변환
      const x = (projected.x * 0.5 + 0.5) * window.innerWidth;
      const y = (-projected.y * 0.5 + 0.5) * window.innerHeight;

      // HTML 요소 위치 업데이트
      textOverlay.style.left = \`\${x}px\`;
      textOverlay.style.top = \`\${y}px\`;
    }

    // 텍스트 오버레이 업데이트
    window.updateTextOverlay = function(text, position, color) {
      textOverlay.textContent = text;
      textOverlay.style.color = color;
      textOverlay.style.display = text ? 'block' : 'none';
      textEnabled = !!text;
      currentTextPosition = position;

      // position에 따라 3D 공간에서의 위치 조정
      if (position === 'top') {
        labelPosition.set(0, 0.5, 0);
      } else if (position === 'bottom') {
        labelPosition.set(0, -0.5, 0);
      } else {
        labelPosition.set(0, 0, 0);
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
      updateLabelPosition(); // 매 프레임마다 텍스트 위치 업데이트
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
      Alert.alert('알림', '배경 제거는 Luma 가우시안 스플래팅 에셋에서만 가능합니다.');
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
      Alert.alert('알림', '텍스트를 입력해주세요.');
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
    Alert.alert('완료', '텍스트가 추가되었습니다!');
  };

  const handlePost = async () => {
    if (!imageUrl || !caption) {
      Alert.alert('오류', '이미지와 캡션을 입력해주세요.');
      return;
    }

    setIsUploading(true);
    try {
      const hashtagArray = hashtags
        .split(' ')
        .filter(tag => tag.startsWith('#'))
        .map(tag => tag.substring(1));

      await api.createPost({
        imageUrl: imageUrl,
        image3dUrl: isLuma ? captureUrl : undefined,
        is3D: isLuma,
        caption: textOverlay ? `${caption}\n\n"${textOverlay}"` : caption,
        location: location || undefined,
        hashtags: hashtagArray,
      });

      Alert.alert('성공', '게시물이 업로드되었습니다!');
      router.push('/(tabs)/feed');
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('오류', '게시물 업로드에 실패했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  const editOptions = [
    {
      id: 'removeBackground',
      title: removeBackground ? '배경 복원' : '배경 제거',
      icon: 'layers-outline' as const,
      description: 'Luma semanticsMask 필터링',
      onPress: handleRemoveBackground,
      disabled: !isLuma,
    },
    {
      id: 'addText',
      title: '텍스트 추가',
      icon: 'text-outline' as const,
      description: '3D 씬에 텍스트 오버레이',
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
        <Text style={styles.headerTitle}>에셋 편집</Text>
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
                2D 이미지는 미리보기만 가능합니다
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
              <Text style={styles.modalTitle}>편집 옵션</Text>
              <TouchableOpacity onPress={() => setShowEditMenu(false)}>
                <Ionicons name="close" size={24} color="#1F2937" />
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
                        Luma 에셋 전용 기능
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

            {/* 텍스트 추가 입력 영역 */}
            <View style={styles.textInputSection}>
              <Text style={styles.sectionTitle}>텍스트 오버레이</Text>
              <TextInput
                style={styles.textInput}
                placeholder="추가할 텍스트 입력..."
                placeholderTextColor="#9CA3AF"
                value={textOverlay}
                onChangeText={setTextOverlay}
                multiline
              />
              <View style={styles.textPositionSelector}>
                <Text style={styles.textPositionLabel}>위치:</Text>
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
                      {pos === 'top' ? '상단' : pos === 'center' ? '중앙' : '하단'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity
                style={styles.addTextButton}
                onPress={handleAddText}
                disabled={!textOverlay.trim()}
              >
                <Text style={styles.addTextButtonText}>텍스트 적용</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Modal>

        {/* 게시물 정보 입력 */}
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="캡션을 입력하세요..."
            placeholderTextColor="#9CA3AF"
            value={caption}
            onChangeText={setCaption}
            multiline
            numberOfLines={3}
          />

          <TextInput
            style={styles.input}
            placeholder="위치 (예: 파리, 프랑스)"
            placeholderTextColor="#9CA3AF"
            value={location}
            onChangeText={setLocation}
          />

          <TextInput
            style={styles.input}
            placeholder="해시태그 (예: #가우시안스플래팅 #3D)"
            placeholderTextColor="#9CA3AF"
            value={hashtags}
            onChangeText={setHashtags}
          />

          {isLuma && (
            <View style={styles.lumaInfo}>
              <Ionicons name="information-circle" size={20} color="#6366F1" />
              <Text style={styles.lumaInfoText}>
                Luma 가우시안 스플래팅 에셋입니다. 360도 회전하며 편집할 수 있습니다.
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
              <Text style={styles.postButtonText}>게시</Text>
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
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  editButton: {
    padding: 4,
  },
  content: {
    flex: 1,
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
  editOptionsList: {
    padding: 16,
  },
  editOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 12,
  },
  editOptionDisabled: {
    opacity: 0.5,
  },
  editOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEF2FF',
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
  },
  editOptionTitleDisabled: {
    color: '#9CA3AF',
  },
  editOptionDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  editOptionWarning: {
    fontSize: 12,
    color: '#F59E0B',
    marginTop: 4,
  },
  textInputSection: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 80,
  },
  textPositionSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
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
    backgroundColor: '#6366F1',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  addTextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  form: {
    padding: 16,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  lumaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
  },
  lumaInfoText: {
    flex: 1,
    fontSize: 14,
    color: '#4F46E5',
  },
  postButton: {
    backgroundColor: '#6366F1',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
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
