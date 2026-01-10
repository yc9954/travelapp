import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Modal,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Sample asset data (later fetch from API)
const sampleAssets = [
  { id: '1', name: 'Eiffel Tower', lat: 48.8584, lon: 2.2945, captureUrl: 'https://lumalabs.ai/capture/ca9ea966-ca24-4ec1-ab0f-af665cb546ff' },
  { id: '2', name: 'Statue of Liberty', lat: 40.6892, lon: -74.0445, captureUrl: 'https://lumalabs.ai/capture/e5b6d44c-43e1-4d1e-b2d5-eca9d334b3fa' },
  { id: '3', name: 'Seoul Tower', lat: 37.5512, lon: 126.9882, captureUrl: 'https://lumalabs.ai/capture/822bac8d-70c6-404e-aaae-f89f46672c67' },
  { id: '4', name: 'Tokyo Tower', lat: 35.6586, lon: 139.7454, captureUrl: 'https://lumalabs.ai/capture/9d9e1e45-b089-4e4b-bb7d-ebc2d8cc7f57' },
  { id: '5', name: 'Sydney Opera', lat: -33.8568, lon: 151.2153, captureUrl: 'https://lumalabs.ai/capture/9dfc3d2d-c6c4-40e6-b23c-c44f3f84af99' },
];

export default function TravelScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState<typeof sampleAssets[0] | null>(null);
  const [showAssetModal, setShowAssetModal] = useState(false);

  const getMapHTML = () => {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Travel Map</title>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { overflow: hidden; background: #000; }
    #map { width: 100vw; height: 100vh; }

    .custom-marker {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #60A5FA;
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(96, 165, 250, 0.5);
      cursor: pointer;
      transition: all 0.2s;
    }

    .custom-marker:hover {
      transform: scale(1.2);
      box-shadow: 0 4px 16px rgba(96, 165, 250, 0.8);
    }

    .leaflet-popup-content-wrapper {
      background: rgba(15, 23, 42, 0.96);
      color: white;
      border-radius: 12px;
      padding: 0;
      box-shadow: 0 8px 24px rgba(0,0,0,0.4);
    }

    .leaflet-popup-tip {
      background: rgba(15, 23, 42, 0.96);
    }

    .leaflet-popup-close-button {
      color: white !important;
      font-size: 22px !important;
      padding: 4px 8px !important;
    }

    .asset-popup {
      padding: 18px;
      min-width: 220px;
    }

    .asset-popup h3 {
      margin: 0 0 10px 0;
      font-size: 18px;
      font-weight: 600;
      color: #F3F4F6;
    }

    .asset-popup .location {
      margin-bottom: 14px;
      font-size: 12px;
      color: #94A3B8;
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
  </style>
</head>
<body>
  <div id='map'></div>

  <script>
    const map = L.map('map', {
      center: [20, 10],
      zoom: 1.5,
      minZoom: 1,
      maxZoom: 18,
      zoomControl: true,
      attributionControl: false,
      touchZoom: true,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      boxZoom: true
    });

    // Mapbox Dark Theme (Get free token at https://account.mapbox.com/access-tokens/)
    const mapboxToken = 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw';

    L.tileLayer('https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/{z}/{x}/{y}?access_token=' + mapboxToken, {
      maxZoom: 19,
      tileSize: 512,
      zoomOffset: -1
    }).addTo(map);

    const assets = ${JSON.stringify(sampleAssets)};

    assets.forEach(asset => {
      const icon = L.divIcon({
        className: 'custom-div-icon',
        html: '<div class="custom-marker"></div>',
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });

      const marker = L.marker([asset.lat, asset.lon], { icon: icon })
        .addTo(map);

      const popupContent = \`
        <div class="asset-popup">
          <h3>\${asset.name}</h3>
          <div class="location">\${asset.lat.toFixed(2)}°, \${asset.lon.toFixed(2)}°</div>
          <button class="view-btn" onclick="viewAsset('\${asset.id}', '\${asset.name}', '\${asset.captureUrl}')">
            View in 3D
          </button>
        </div>
      \`;

      marker.bindPopup(popupContent, {
        maxWidth: 260,
        className: 'custom-popup'
      });
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

    setTimeout(() => {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'mapLoaded' }));
      }
    }, 500);
  </script>
</body>
</html>
    `;
  };

  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      if (data.type === 'mapLoaded') {
        console.log('Map loaded successfully');
      } else if (data.type === 'viewAsset') {
        const asset = sampleAssets.find(a => a.id === data.assetId);
        if (asset) {
          setSelectedAsset(asset);
          setShowAssetModal(true);
        }
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
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: #000; }
    #canvas-container { width: 100%; height: 100%; }
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
    import { LumaSplatsThree } from '@lumaai/luma-web';

    let scene = new THREE.Scene();
    let camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 2;

    let renderer = new THREE.WebGLRenderer({ antialias: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('canvas-container').appendChild(renderer.domElement);

    let controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.0;
    controls.enableZoom = true;
    controls.zoomSpeed = 1.0;
    controls.minDistance = 0.5;
    controls.maxDistance = 10;

    let splat = new LumaSplatsThree({
      source: '${captureUrl}',
      enableThreeShaderIntegration: false,
    });
    scene.add(splat);

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
            <WebView
              source={{ html: get3DViewerHTML(selectedAsset.captureUrl) }}
              style={styles.viewer3D}
              scrollEnabled={false}
              bounces={false}
              scalesPageToFit={true}
              javaScriptEnabled={true}
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  webview: {
    flex: 1,
    backgroundColor: '#000000',
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
});
