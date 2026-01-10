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

  const getThreeJsEarthHTML = () => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Flight Simulator</title>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: #000; }
    #container { width: 100%; height: 100%; }

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
  <div id="container"></div>

  <div class="hud" id="hud">
    <div>✈️ Flight Simulator</div>
    <div>Speed: <span id="speed">540</span> km/h</div>
    <div>Altitude: <span id="altitude">10000</span> m</div>
    <div>Lat: <span id="lat">37.57</span>°</div>
    <div>Lon: <span id="lon">126.98</span>°</div>
  </div>

  <script>
    // React Native WebView 통신
    function sendLog(msg) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'log', message: msg }));
      }
      console.log(msg);
    }

    sendLog('Starting Three.js Earth initialization...');

    // 에러 핸들링
    window.onerror = function(msg, url, lineNo, columnNo, error) {
      const errorMsg = 'Error: ' + msg + ' at line ' + lineNo;
      sendLog(errorMsg);
      return false;
    };

    // Three.js가 로드되었는지 확인
    if (typeof THREE === 'undefined') {
      sendLog('ERROR: Three.js library not loaded!');
      document.getElementById('hud').innerHTML = '<div style="color:red;">Three.js library not loaded</div>';
    } else {
      sendLog('Three.js library loaded successfully');
    }

    try {
      // Scene, Camera, Renderer 설정
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      const renderer = new THREE.WebGLRenderer({ antialias: true });

      renderer.setSize(window.innerWidth, window.innerHeight);
      document.getElementById('container').appendChild(renderer.domElement);

      sendLog('Three.js renderer created successfully');

      // 별이 빛나는 우주 배경
      const starGeometry = new THREE.BufferGeometry();
      const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 2 });
      const starVertices = [];
      for (let i = 0; i < 1000; i++) {
        const x = (Math.random() - 0.5) * 2000;
        const y = (Math.random() - 0.5) * 2000;
        const z = (Math.random() - 0.5) * 2000;
        starVertices.push(x, y, z);
      }
      starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
      const stars = new THREE.Points(starGeometry, starMaterial);
      scene.add(stars);

      sendLog('Stars added to scene');

      // 지구 만들기
      const earthGeometry = new THREE.SphereGeometry(50, 64, 64);

      // 지구 텍스처 (간단한 파란색 + 초록색)
      const earthMaterial = new THREE.MeshPhongMaterial({
        color: 0x2233ff,
        emissive: 0x112244,
        specular: 0x333333,
        shininess: 25
      });

      const earth = new THREE.Mesh(earthGeometry, earthMaterial);
      scene.add(earth);

      sendLog('Earth sphere created');

      // 구름 레이어
      const cloudGeometry = new THREE.SphereGeometry(50.5, 64, 64);
      const cloudMaterial = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.2
      });
      const clouds = new THREE.Mesh(cloudGeometry, cloudMaterial);
      scene.add(clouds);

      // 대기 효과
      const atmosphereGeometry = new THREE.SphereGeometry(52, 64, 64);
      const atmosphereMaterial = new THREE.MeshPhongMaterial({
        color: 0x0088ff,
        transparent: true,
        opacity: 0.15,
        side: THREE.BackSide
      });
      const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
      scene.add(atmosphere);

      sendLog('Atmosphere added');

      // 비행기 만들기 (간단한 삼각형)
      const planeGeometry = new THREE.ConeGeometry(2, 6, 4);
      const planeMaterial = new THREE.MeshPhongMaterial({ color: 0xff6600, emissive: 0xff3300 });
      const airplane = new THREE.Mesh(planeGeometry, planeMaterial);
      airplane.rotation.x = Math.PI / 2;
      scene.add(airplane);

      sendLog('Airplane created');

      // 조명
      const sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
      sunLight.position.set(100, 50, 50);
      scene.add(sunLight);

      const ambientLight = new THREE.AmbientLight(0x404040);
      scene.add(ambientLight);

      // 비행 파라미터
      let longitude = 126.9780 * Math.PI / 180;
      let latitude = 37.5665 * Math.PI / 180;
      let altitude = 60; // 지구 반지름 + 고도
      let heading = 0;
      let speed = 150;

      // 비행기 위치 업데이트
      function updateAirplane() {
        // 위도/경도를 3D 좌표로 변환
        const x = altitude * Math.cos(latitude) * Math.cos(longitude);
        const y = altitude * Math.sin(latitude);
        const z = altitude * Math.cos(latitude) * Math.sin(longitude);

        airplane.position.set(x, y, z);

        // 비행기가 지구 표면을 향하도록 회전
        airplane.lookAt(0, 0, 0);
        airplane.rotateX(Math.PI / 2);

        // 카메라를 비행기 뒤에 배치
        const cameraDistance = 30;
        const cameraX = x * 1.3;
        const cameraY = y * 1.3;
        const cameraZ = z * 1.3;

        camera.position.set(cameraX, cameraY, cameraZ);
        camera.lookAt(airplane.position);
      }

      // HUD 업데이트
      function updateHUD() {
        const speedKmh = Math.round(speed * 3.6);
        const altitudeM = Math.round((altitude - 50) * 1000);
        const latDeg = (latitude * 180 / Math.PI).toFixed(2);
        const lonDeg = (longitude * 180 / Math.PI).toFixed(2);

        document.getElementById('speed').textContent = speedKmh;
        document.getElementById('altitude').textContent = altitudeM;
        document.getElementById('lat').textContent = latDeg;
        document.getElementById('lon').textContent = lonDeg;
      }

      // 자동 비행
      function autoFlight(deltaTime) {
        // 천천히 이동
        heading += 0.2 * deltaTime;
        longitude += 0.05 * deltaTime;

        // 지구 자전
        earth.rotation.y += 0.01 * deltaTime;
        clouds.rotation.y += 0.012 * deltaTime;
      }

      // 애니메이션 루프
      let lastTime = performance.now();

      function animate() {
        requestAnimationFrame(animate);

        const currentTime = performance.now();
        const deltaTime = (currentTime - lastTime) / 1000.0;
        lastTime = currentTime;

        autoFlight(deltaTime);
        updateAirplane();
        updateHUD();

        renderer.render(scene, camera);
      }

      // 윈도우 리사이즈 처리
      window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      });

      // 시작
      updateAirplane();
      updateHUD();
      animate();

      sendLog('Flight simulator initialized successfully!');

    } catch (error) {
      sendLog('ERROR: ' + error.message);
      document.getElementById('hud').innerHTML = '<div style="color:red; font-size:11px; line-height:1.4;">Error initializing:<br/>' + error.message + '</div>';
    }
  </script>
</body>
</html>
    `;
  };

  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'log') {
        console.log('[WebView]', data.message);
      }
    } catch (e) {
      console.log('[WebView] Raw message:', event.nativeEvent.data);
    }
  };

  return (
    <View style={styles.container}>
      {/* Three.js Earth Flight Simulator - Full Screen */}
      <WebView
        source={{ html: getThreeJsEarthHTML() }}
        style={styles.webview}
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => setIsLoading(false)}
        onMessage={handleWebViewMessage}
        scrollEnabled={false}
        bounces={false}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('WebView error:', nativeEvent);
        }}
      />
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#60A5FA" />
          <Text style={styles.loadingText}>Loading Flight Simulator...</Text>
          <Text style={styles.loadingSubtext}>Initializing 3D Earth...</Text>
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
