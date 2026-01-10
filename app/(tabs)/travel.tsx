import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { WebView } from 'react-native-webview';

export default function TravelScreen() {
  const [isLoading, setIsLoading] = useState(true);

  const getCesiumFlightSimulatorHTML = () => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Flight Simulator</title>
  <script src="https://cesium.com/downloads/cesiumjs/releases/1.111/Build/Cesium/Cesium.js"></script>
  <link href="https://cesium.com/downloads/cesiumjs/releases/1.111/Build/Cesium/Widgets/widgets.css" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; }
    #cesiumContainer { width: 100%; height: 100%; }

    .hud {
      position: absolute;
      top: 20px;
      left: 20px;
      background: rgba(0, 0, 0, 0.7);
      color: white;
      padding: 15px;
      border-radius: 10px;
      font-family: monospace;
      font-size: 14px;
      line-height: 1.6;
      z-index: 1000;
      backdrop-filter: blur(10px);
    }
  </style>
</head>
<body>
  <div id="cesiumContainer"></div>

  <div class="hud" id="hud">
    <div>✈️ Flight Simulator</div>
    <div>Speed: <span id="speed">0</span> km/h</div>
    <div>Altitude: <span id="altitude">0</span> m</div>
    <div>Lat: <span id="lat">0</span>°</div>
    <div>Lon: <span id="lon">0</span>°</div>
  </div>

  <script>
    // Cesium Ion token (공개 데모 토큰)
    Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJlYWE1OWUxNy1mMWZiLTQzYjYtYTQ0OS1kMWFjYmFkNjc5YzYiLCJpZCI6NTc3MzMsImlhdCI6MTYyNzg0NTE4Mn0.XcKpgANiY19MC4bdFUXMVEBToBmqS8kuYpUlxJHYZxk';

    const viewer = new Cesium.Viewer('cesiumContainer', {
      terrainProvider: Cesium.createWorldTerrain(),
      imageryProvider: new Cesium.IonImageryProvider({ assetId: 2 }),
      baseLayerPicker: false,
      geocoder: false,
      homeButton: false,
      sceneModePicker: false,
      navigationHelpButton: false,
      animation: false,
      timeline: false,
      fullscreenButton: false,
      vrButton: false,
      skyBox: new Cesium.SkyBox({
        sources: {
          positiveX: 'https://cesium.com/downloads/cesiumjs/releases/1.111/Build/Cesium/Assets/Textures/SkyBox/tycho2t3_80_px.jpg',
          negativeX: 'https://cesium.com/downloads/cesiumjs/releases/1.111/Build/Cesium/Assets/Textures/SkyBox/tycho2t3_80_mx.jpg',
          positiveY: 'https://cesium.com/downloads/cesiumjs/releases/1.111/Build/Cesium/Assets/Textures/SkyBox/tycho2t3_80_py.jpg',
          negativeY: 'https://cesium.com/downloads/cesiumjs/releases/1.111/Build/Cesium/Assets/Textures/SkyBox/tycho2t3_80_my.jpg',
          positiveZ: 'https://cesium.com/downloads/cesiumjs/releases/1.111/Build/Cesium/Assets/Textures/SkyBox/tycho2t3_80_pz.jpg',
          negativeZ: 'https://cesium.com/downloads/cesiumjs/releases/1.111/Build/Cesium/Assets/Textures/SkyBox/tycho2t3_80_mz.jpg'
        }
      })
    });

    viewer.scene.globe.enableLighting = true;

    // 비행기 초기 위치 (서울 상공)
    let longitude = Cesium.Math.toRadians(126.9780);
    let latitude = Cesium.Math.toRadians(37.5665);
    let height = 10000.0; // 10km 고도

    // 비행 파라미터
    let speed = 150.0; // m/s (초기 속도 ~540 km/h)
    let heading = 0.0;
    let pitch = 0.0;
    let roll = 0.0;

    // 비행기 모델 추가
    const airplane = viewer.entities.add({
      position: Cesium.Cartesian3.fromRadians(longitude, latitude, height),
      model: {
        uri: 'https://cesium.com/downloads/cesiumjs/releases/1.111/Build/Cesium/SampleData/models/CesiumAir/Cesium_Air.glb',
        minimumPixelSize: 128,
        maximumScale: 200
      }
    });

    // 카메라를 비행기 뒤에 배치
    function updateCamera() {
      const position = Cesium.Cartesian3.fromRadians(longitude, latitude, height);

      // 비행기 방향 계산
      const hpr = new Cesium.HeadingPitchRoll(heading, pitch, roll);
      const orientation = Cesium.Transforms.headingPitchRollQuaternion(position, hpr);

      airplane.position = position;
      airplane.orientation = orientation;

      // 카메라를 비행기 뒤에서 약간 위쪽에 배치
      const distance = 50.0;
      const cameraOffset = new Cesium.Cartesian3(-distance, 0, distance * 0.3);

      viewer.scene.camera.lookAtTransform(
        Cesium.Transforms.eastNorthUpToFixedFrame(position),
        cameraOffset
      );
    }

    // HUD 업데이트
    function updateHUD() {
      document.getElementById('speed').textContent = Math.round(speed * 3.6);
      document.getElementById('altitude').textContent = Math.round(height);
      document.getElementById('lat').textContent = Cesium.Math.toDegrees(latitude).toFixed(4);
      document.getElementById('lon').textContent = Cesium.Math.toDegrees(longitude).toFixed(4);
    }

    // 비행 물리 시뮬레이션
    function updateFlight(deltaTime) {
      // 속도에 따른 이동
      const distance = speed * deltaTime;

      // 지구 표면에서의 이동 계산
      const deltaLon = Math.sin(heading) * Math.cos(pitch) * distance / (111320.0 * Math.cos(latitude));
      const deltaLat = Math.cos(heading) * Math.cos(pitch) * distance / 111320.0;
      const deltaHeight = Math.sin(pitch) * distance;

      longitude += deltaLon;
      latitude += deltaLat;
      height += deltaHeight;

      // 최소 고도 제한 (지형 위 500m)
      if (height < 500) {
        height = 500;
        pitch = Math.max(pitch, 0); // 상승만 가능
      }

      // 최대 고도 제한
      if (height > 50000) {
        height = 50000;
      }

      // Roll을 heading 변화에 따라 자동 조정 (더 자연스러운 비행)
      roll = Cesium.Math.lerp(roll, -heading * 0.1, 0.05);
    }

    // 자동 비행 모드 - 천천히 앞으로 비행
    function autoFlight() {
      speed = 150.0; // 일정한 속도 유지
      heading += 0.001; // 천천히 우회전하면서 비행
    }

    // 메인 업데이트 루프
    let lastTime = performance.now();

    function tick() {
      const currentTime = performance.now();
      const deltaTime = (currentTime - lastTime) / 1000.0;
      lastTime = currentTime;

      autoFlight(); // 자동 비행
      updateFlight(deltaTime);
      updateCamera();
      updateHUD();

      // Pitch를 천천히 0으로 회귀 (자동 수평 유지)
      pitch = Cesium.Math.lerp(pitch, 0, 0.02);

      requestAnimationFrame(tick);
    }

    // 초기화 및 시작
    updateCamera();
    updateHUD();
    tick();

    // 드래그로 카메라 회전 비활성화 (비행기 뒤에서만 봄)
    viewer.scene.screenSpaceCameraController.enableRotate = true;
    viewer.scene.screenSpaceCameraController.enableTranslate = false;
    viewer.scene.screenSpaceCameraController.enableZoom = false;
    viewer.scene.screenSpaceCameraController.enableTilt = true;
    viewer.scene.screenSpaceCameraController.enableLook = true;
  </script>
</body>
</html>
    `;
  };

  return (
    <View style={styles.container}>
      {/* Cesium Flight Simulator - Full Screen */}
      <WebView
        source={{ html: getCesiumFlightSimulatorHTML() }}
        style={styles.webview}
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => setIsLoading(false)}
        scrollEnabled={false}
        bounces={false}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
      />
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#60A5FA" />
          <Text style={styles.loadingText}>Loading Flight Simulator...</Text>
          <Text style={styles.loadingSubtext}>Initializing Cesium terrain...</Text>
        </View>
      )}
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
  loadingSubtext: {
    color: '#94A3B8',
    fontSize: 14,
  },
});
