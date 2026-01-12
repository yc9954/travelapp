import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { travelAssets, type TravelAsset } from '../../services/mockData';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Travel 에셋 데이터 사용
const sampleAssets = travelAssets;

export default function TravelScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState<TravelAsset | null>(null);
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [viewerLoading, setViewerLoading] = useState(true);
  const [viewerError, setViewerError] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const webViewRef = useRef<WebView>(null);

  const getMapHTML = () => {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Travel Map</title>
  <script src="https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.js"></script>
  <link href="https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.css" rel="stylesheet" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { overflow: hidden; background: #F5F5F5; }
    #map { width: 100vw; height: 100vh; }

    .maplibregl-popup-content {
      background: rgba(255, 255, 255, 0.98) !important;
      color: #1F2937 !important;
      border-radius: 12px !important;
      padding: 0 !important;
      box-shadow: 0 8px 24px rgba(0,0,0,0.15) !important;
      border: 1px solid rgba(0,0,0,0.1) !important;
    }

    .maplibregl-popup-tip {
      border-top-color: rgba(255, 255, 255, 0.98) !important;
    }

    .maplibregl-popup-close-button {
      color: #6B7280 !important;
      font-size: 22px !important;
      padding: 4px 8px !important;
      opacity: 0.7 !important;
    }

    .maplibregl-popup-close-button:hover {
      opacity: 1 !important;
      color: #1F2937 !important;
    }

    .asset-popup {
      padding: 18px;
      min-width: 220px;
    }

    .asset-popup h3 {
      margin: 0 0 10px 0;
      font-size: 18px;
      font-weight: 600;
      color: #1F2937;
    }

    .asset-popup .location {
      margin-bottom: 14px;
      font-size: 12px;
      color: #6B7280;
    }

    .view-btn {
      background: #60A5FA;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 14px;
      cursor: pointer;
      width: 100%;
      transition: all 0.2s;
    }

    .view-btn:active {
      background: #3B82F6;
      transform: scale(0.98);
    }

    .maplibregl-ctrl-group {
      background: rgba(255, 255, 255, 0.95) !important;
      border-radius: 8px !important;
      border: 1px solid rgba(0, 0, 0, 0.1) !important;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important;
    }

    .maplibregl-ctrl button {
      background-color: transparent !important;
      color: #374151 !important;
    }

    .maplibregl-ctrl button:hover {
      background-color: rgba(0, 0, 0, 0.05) !important;
    }
  </style>
</head>
<body>
  <div id='map'></div>

  <script>
    // MapLibre GL JS - API 키 불필요, 완전 무료 오픈소스
    // Carto Positron 스타일 사용 (밝은 테마, 안정적)
    const map = new maplibregl.Map({
      container: 'map',
      style: {
        version: 8,
        sources: {
          'carto-tiles': {
            type: 'raster',
            tiles: [
              'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
              'https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
              'https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
            ],
            tileSize: 256,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          }
        },
        layers: [
          {
            id: 'carto-layer',
            type: 'raster',
            source: 'carto-tiles',
            minzoom: 0,
            maxzoom: 22
          }
        ],
        glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf'
      },
      center: [10, 20],
      zoom: 1.5,
      minZoom: 1,
      maxZoom: 18,
      attributionControl: false,
      antialias: true,
      preserveDrawingBuffer: true
    });

    // 지도 객체를 전역 변수로 저장
    window.mapInstance = map;

    map.on('load', () => {
      const assets = ${JSON.stringify(sampleAssets)};

      assets.forEach(asset => {
        // 커스텀 마커 엘리먼트 생성 (빨간색 원형 마커)
        const el = document.createElement('div');
        el.className = 'custom-marker';
        el.style.width = '16px';
        el.style.height = '16px';
        el.style.borderRadius = '50%';
        el.style.backgroundColor = '#EF4444';
        el.style.border = '3px solid white';
        el.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
        el.style.cursor = 'pointer';
        el.style.transition = 'all 0.2s';
        el.style.zIndex = '1000';

        el.addEventListener('mouseenter', () => {
          el.style.transform = 'scale(1.3)';
          el.style.boxShadow = '0 2px 8px rgba(239, 68, 68, 0.6)';
        });

        el.addEventListener('mouseleave', () => {
          el.style.transform = 'scale(1)';
          el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
        });

        // 마커 생성
        const marker = new maplibregl.Marker(el)
          .setLngLat([asset.lon, asset.lat])
          .addTo(map);

        // 팝업 생성
        const popupContent = document.createElement('div');
        popupContent.className = 'asset-popup';
        popupContent.innerHTML = \`
          <h3>\${asset.name}</h3>
          <div class="location">\${asset.lat.toFixed(2)}°, \${asset.lon.toFixed(2)}°</div>
          <button class="view-btn" onclick="viewAsset('\${asset.id}', '\${asset.name}', '\${asset.captureUrl}')">
            View
          </button>
        \`;

        const popup = new maplibregl.Popup({
          offset: 25,
          closeButton: true,
          closeOnClick: false,
          maxWidth: '260px'
        }).setDOMContent(popupContent);

        marker.setPopup(popup);
      });

      // 지도 로드 완료 메시지 전송
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'mapLoaded' }));
      }
    });

    map.on('error', (e) => {
      console.error('MapLibre error:', e);
      // 에러가 발생해도 계속 시도하도록 설정
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ 
          type: 'mapError', 
          error: e.error?.message || 'Unknown error' 
        }));
      }
    });

    // 타일 로드 에러 처리
    map.on('data', (e) => {
      if (e.dataType === 'source' && e.isSourceLoaded === false) {
        console.warn('Tile source load failed, retrying...');
      }
    });

    function viewAsset(id, name, captureUrl) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'viewAsset',
          assetId: id,
          assetName: name,
          captureUrl: captureUrl
        }));
      }
    }
  </script>
</body>
</html>
    `;
  };

  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      if (data.type === 'mapLoaded' || data.type === 'mapReady') {
        console.log('Map loaded successfully');
        setIsLoading(false);
      } else if (data.type === 'mapError') {
        console.error('MapLibre error:', data.error);
        setIsLoading(false);
      } else if (data.type === 'viewAsset') {
        const asset = sampleAssets.find(a => a.id === data.assetId);
        if (asset) {
          setSelectedAsset(asset);
          setShowAssetModal(true);
          setViewerLoading(true);
          setViewerError(false);
        }
      } else if (data.type === 'viewerLoaded') {
        setViewerLoading(false);
        setViewerError(false);
      } else if (data.type === 'viewerError') {
        setViewerLoading(false);
        setViewerError(true);
      }
    } catch (e) {
      console.log('[WebView] Message:', event.nativeEvent.data);
    }
  };

  const get3DViewerHTML = (captureUrl: string) => {
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
      Color
    } from 'three';
    import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
    import { LumaSplatsThree } from '@lumaai/luma-web';

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
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.0;
    controls.minDistance = 0.5;
    controls.maxDistance = 10;

    // Splat 로드
    const splat = new LumaSplatsThree({
      source: '${captureUrl}',
      enableThreeShaderIntegration: false,
      particleRevealEnabled: true,
    });

    splat.onLoad = () => {
      console.log('Splat loaded successfully');
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'viewerLoaded'
        }));
      }
    };

    splat.onError = (error) => {
      console.error('Splat load error:', error);
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'viewerError',
          error: error?.message || 'Failed to load 3D scene'
        }));
      }
    };

    scene.add(splat);

    // 애니메이션 루프
    function animate() {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    }

    // 리사이즈 핸들러
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight, false);
    });

    animate();

    // 지도 제어 함수들을 전역으로 노출
    window.searchLocation = function(query) {
      const searchQuery = encodeURIComponent(query);
      fetch(\`https://nominatim.openstreetmap.org/search?q=\${searchQuery}&format=json&limit=1\`)
        .then(response => response.json())
        .then(results => {
          if (results && results.length > 0) {
            const result = results[0];
            const lat = parseFloat(result.lat);
            const lon = parseFloat(result.lon);
            map.flyTo({
              center: [lon, lat],
              zoom: 12,
              duration: 1000
            });
          }
        })
        .catch(error => {
          console.error('Geocoding error:', error);
        });
    };

    window.centerMap = function() {
      map.flyTo({
        center: [10, 20],
        zoom: 1.5,
        duration: 1000
      });
    };

    window.getCurrentLocation = function() {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            map.flyTo({
              center: [lon, lat],
              zoom: 12,
              duration: 1000
            });
          },
          (error) => {
            console.error('Geolocation error:', error);
            // 에러 시 기본 위치로 이동
            map.flyTo({
              center: [10, 20],
              zoom: 1.5,
              duration: 1000
            });
          }
        );
      } else {
        // Geolocation이 지원되지 않으면 기본 위치로 이동
        map.flyTo({
          center: [10, 20],
          zoom: 1.5,
          duration: 1000
        });
      }
    };

    // React Native로 준비 완료 메시지 전송
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'mapReady'
      }));
    }
  </script>
</body>
</html>
    `;
  };

  const handleCenterMap = () => {
    // 현재 위치로 이동
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`
        if (window.getCurrentLocation) {
          window.getCurrentLocation();
        }
        true;
      `);
    }
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    
    // WebView에 검색 실행
    if (webViewRef.current) {
      const query = searchQuery.trim();
      webViewRef.current.injectJavaScript(`
        if (window.searchLocation) {
          window.searchLocation('${query.replace(/'/g, "\\'")}');
        }
        true;
      `);
    }
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search locations..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={styles.clearButton}
            >
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </View>


      <WebView
        ref={webViewRef}
        source={{ html: getMapHTML() }}
        style={styles.webview}
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => setIsLoading(false)}
        onMessage={handleWebViewMessage}
        scrollEnabled={false}
        bounces={false}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        geolocationEnabled={true}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('WebView error:', nativeEvent);
        }}
      />
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#60A5FA" />
          <Text style={styles.loadingText}>Loading map...</Text>
        </View>
      )}

      {/* Current Location Button */}
      <TouchableOpacity style={styles.locationButton} onPress={handleCenterMap}>
        <Ionicons name="locate" size={24} color="#1F2937" />
      </TouchableOpacity>

      {/* Asset 3D Viewer Modal */}
      <Modal
        visible={showAssetModal}
        animationType="slide"
        onRequestClose={() => setShowAssetModal(false)}
      >
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setShowAssetModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={28} color="#F3F4F6" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{selectedAsset?.name}</Text>
            <View style={{ width: 28 }} />
          </View>

          {/* 3D Viewer */}
          {selectedAsset && (
            <View style={styles.viewer3D}>
              <WebView
                source={{ html: get3DViewerHTML(selectedAsset.captureUrl) }}
                style={styles.viewer3D}
                scrollEnabled={false}
                bounces={false}
                scalesPageToFit={true}
                javaScriptEnabled={true}
                onMessage={handleWebViewMessage}
                onError={(syntheticEvent) => {
                  const { nativeEvent } = syntheticEvent;
                  console.error('3D Viewer WebView error:', nativeEvent);
                  setViewerError(true);
                  setViewerLoading(false);
                }}
              />
              {viewerLoading && (
                <View style={styles.viewerLoadingContainer}>
                  <ActivityIndicator size="large" color="#60A5FA" />
                  <Text style={styles.viewerLoadingText}>Loading 3D scene...</Text>
                </View>
              )}
              {viewerError && (
                <View style={styles.viewerErrorContainer}>
                  <Ionicons name="alert-circle" size={48} color="#EF4444" />
                  <Text style={styles.viewerErrorText}>Failed to load 3D scene</Text>
                  <Text style={styles.viewerErrorSubtext}>Please try again later</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  searchContainer: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 0.5,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
    padding: 0,
  },
  clearButton: {
    marginLeft: 8,
    padding: 4,
  },
  locationButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 1001,
  },
  webview: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    gap: 12,
  },
  loadingText: {
    color: '#F3F4F6',
    fontSize: 16,
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#0F172A',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F3F4F6',
  },
  viewer3D: {
    flex: 1,
    backgroundColor: '#000000',
  },
  viewerLoadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    gap: 12,
  },
  viewerLoadingText: {
    color: '#F3F4F6',
    fontSize: 16,
    fontWeight: '500',
  },
  viewerErrorContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    gap: 12,
    padding: 20,
  },
  viewerErrorText: {
    color: '#EF4444',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  viewerErrorSubtext: {
    color: '#94A3B8',
    fontSize: 14,
    textAlign: 'center',
  },
});
