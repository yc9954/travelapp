import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// 샘플 에셋 데이터 (실제로는 API에서 가져올 데이터)
const sampleAssets = [
  { id: '1', name: 'Eiffel Tower', lat: 48.8584, lon: 2.2945, captureUrl: 'https://lumalabs.ai/capture/example1' },
  { id: '2', name: 'Statue of Liberty', lat: 40.6892, lon: -74.0445, captureUrl: 'https://lumalabs.ai/capture/example2' },
  { id: '3', name: 'Seoul Tower', lat: 37.5512, lon: 126.9882, captureUrl: 'https://lumalabs.ai/capture/example3' },
  { id: '4', name: 'Tokyo Tower', lat: 35.6586, lon: 139.7454, captureUrl: 'https://lumalabs.ai/capture/example4' },
  { id: '5', name: 'Sydney Opera', lat: -33.8568, lon: 151.2153, captureUrl: 'https://lumalabs.ai/capture/example5' },
];

export default function TravelScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

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
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: 4px solid white;
      box-shadow: 0 4px 16px rgba(102, 126, 234, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      cursor: pointer;
      transition: all 0.3s;
    }

    .custom-marker:hover {
      transform: scale(1.3);
      box-shadow: 0 6px 24px rgba(102, 126, 234, 0.9);
    }

    .leaflet-popup-content-wrapper {
      background: rgba(15, 23, 42, 0.98);
      color: white;
      border-radius: 16px;
      padding: 0;
      box-shadow: 0 8px 32px rgba(0,0,0,0.5);
    }

    .leaflet-popup-tip {
      background: rgba(15, 23, 42, 0.98);
    }

    .asset-popup {
      padding: 20px;
      min-width: 240px;
    }

    .asset-popup h3 {
      margin: 0 0 12px 0;
      font-size: 20px;
      font-weight: 700;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .asset-popup .location {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
      font-size: 13px;
      color: #94A3B8;
    }

    .view-btn {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 10px;
      font-weight: 700;
      font-size: 15px;
      cursor: pointer;
      width: 100%;
      transition: all 0.2s;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }

    .view-btn:active {
      transform: scale(0.98);
    }
  </style>
</head>
<body>
  <div id='map'></div>

  <script>
    // 다크 테마 지도 초기화
    const map = L.map('map', {
      center: [37.5665, 126.9780], // Seoul
      zoom: 2,
      zoomControl: true,
      attributionControl: false
    });

    // CartoDB Dark Matter 타일 레이어 (무료, 토큰 불필요)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd'
    }).addTo(map);

    const assets = ${JSON.stringify(sampleAssets)};

    // 커스텀 아이콘으로 마커 추가
    assets.forEach(asset => {
      const icon = L.divIcon({
        className: 'custom-div-icon',
        html: '<div class="custom-marker">🌍</div>',
        iconSize: [50, 50],
        iconAnchor: [25, 25]
      });

      const marker = L.marker([asset.lat, asset.lon], { icon: icon })
        .addTo(map);

      const popupContent = \`
        <div class="asset-popup">
          <h3>\${asset.name}</h3>
          <div class="location">
            <span>📍</span>
            <span>\${asset.lat.toFixed(4)}°, \${asset.lon.toFixed(4)}°</span>
          </div>
          <button class="view-btn" onclick="viewAsset('\${asset.id}', '\${asset.name}')">
            🚀 View in 3D
          </button>
        </div>
      \`;

      marker.bindPopup(popupContent, {
        maxWidth: 300,
        className: 'custom-popup'
      });
    });

    function viewAsset(id, name) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'viewAsset',
          assetId: id,
          assetName: name
        }));
      }
    }

    // 지도 로드 완료
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
        Alert.alert(
          data.assetName,
          'Opening 3D view...',
          [
            {
              text: 'Cancel',
              style: 'cancel'
            },
            {
              text: 'View',
              onPress: () => {
                // 실제로는 해당 에셋의 상세 화면으로 이동
                console.log('Viewing asset:', data.assetId);
                // router.push(`/asset/${data.assetId}`);
              }
            }
          ]
        );
      }
    } catch (e) {
      console.log('[WebView] Message:', event.nativeEvent.data);
    }
  };

  return (
    <View style={styles.container}>
      {/* Map */}
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

      {/* Loading */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.loadingText}>Loading Map...</Text>
        </View>
      )}

      {/* Info Overlay */}
      <View style={styles.infoOverlay}>
        <View style={styles.infoCard}>
          <Ionicons name="location" size={24} color="#667eea" />
          <Text style={styles.infoText}>
            Tap markers to explore 3D assets around the world
          </Text>
        </View>
      </View>
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
    fontSize: 18,
    fontWeight: '600',
  },
  infoOverlay: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  infoText: {
    flex: 1,
    color: '#F3F4F6',
    fontSize: 14,
    fontWeight: '500',
  },
});
