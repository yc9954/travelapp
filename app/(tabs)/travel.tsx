import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';

export default function TravelScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);

  const getCesiumFlightHTML = () => {
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
    html, body { width: 100%; height: 100%; overflow: hidden; font-family: Arial, sans-serif; }
    #cesiumContainer { width: 100%; height: 100%; }
    .controls {
      position: absolute;
      bottom: 20px;
      right: 20px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      z-index: 1000;
    }
    .control-row {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
    }
    .control-btn {
      width: 48px;
      height: 48px;
      background: rgba(59, 130, 246, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 10px;
      color: white;
      font-size: 20px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      user-select: none;
      -webkit-tap-highlight-color: transparent;
      backdrop-filter: blur(10px);
    }
    .control-btn:active {
      background: rgba(96, 165, 250, 0.7);
      transform: scale(0.95);
    }
    .speed-display {
      position: absolute;
      top: 20px;
      left: 20px;
      background: rgba(15, 23, 42, 0.9);
      padding: 12px 20px;
      border-radius: 12px;
      color: white;
      font-size: 14px;
      font-weight: 600;
      backdrop-filter: blur(10px);
      z-index: 1000;
    }
    .location-display {
      position: absolute;
      top: 20px;
      right: 20px;
      background: rgba(15, 23, 42, 0.9);
      padding: 12px 20px;
      border-radius: 12px;
      color: white;
      font-size: 12px;
      backdrop-filter: blur(10px);
      z-index: 1000;
    }
  </style>
</head>
<body>
  <div id="cesiumContainer"></div>
  <div class="speed-display" id="speedDisplay">Speed: 0 km/h</div>
  <div class="location-display" id="locationDisplay">
    <div>Lat: 0.00°</div>
    <div>Lon: 0.00°</div>
    <div>Alt: 0 m</div>
  </div>
  <div class="controls">
    <div class="control-row">
      <button class="control-btn" id="upBtn">↑</button>
    </div>
    <div class="control-row">
      <button class="control-btn" id="leftBtn">←</button>
      <button class="control-btn" id="forwardBtn">▲</button>
      <button class="control-btn" id="rightBtn">→</button>
    </div>
    <div class="control-row">
      <button class="control-btn" id="downBtn">↓</button>
    </div>
  </div>

  <script>
    // Cesium ion token (public token for demo)
    Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJlYWE1OWUxNy1mMWZiLTQzYjYtYTQ0OS1kMWFjYmFkNjc5YzYiLCJpZCI6NTc3MzMsImlhdCI6MTYyNzg0NTE4Mn0.XcKpgANiY19MC4bdFUXMVEBToBmqS8kuYpUlxJHYZxk';

    const viewer = new Cesium.Viewer('cesiumContainer', {
      terrainProvider: Cesium.createWorldTerrain(),
      animation: false,
      timeline: false,
      baseLayerPicker: false,
      fullscreenButton: false,
      geocoder: false,
      homeButton: false,
      sceneModePicker: false,
      selectionIndicator: false,
      navigationHelpButton: false,
      creditContainer: document.createElement('div'),
    });

    // Disable default mouse interactions for better mobile experience
    viewer.scene.screenSpaceCameraController.enableRotate = true;
    viewer.scene.screenSpaceCameraController.enableZoom = true;
    viewer.scene.screenSpaceCameraController.enableTilt = true;
    viewer.scene.screenSpaceCameraController.enableLook = true;

    // Aircraft model
    const planeModel = viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(126.9780, 37.5665, 10000), // Seoul
      model: {
        uri: 'https://cesium.com/downloads/cesiumjs/releases/1.111/Build/Cesium/SampleData/models/CesiumAir/Cesium_Air.glb',
        minimumPixelSize: 128,
        maximumScale: 20000,
      },
    });

    // Flight parameters
    let speed = 100; // m/s
    let heading = 0;
    let pitch = 0;
    let position = Cesium.Cartesian3.fromDegrees(126.9780, 37.5665, 10000);

    // Set initial camera view
    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(126.9780, 37.5665, 15000),
      orientation: {
        heading: 0,
        pitch: -0.5,
        roll: 0
      }
    });

    // Update display
    function updateDisplay() {
      const cartographic = Cesium.Cartographic.fromCartesian(position);
      const lat = Cesium.Math.toDegrees(cartographic.latitude).toFixed(2);
      const lon = Cesium.Math.toDegrees(cartographic.longitude).toFixed(2);
      const alt = Math.round(cartographic.height);

      document.getElementById('speedDisplay').textContent = 'Speed: ' + Math.round(speed * 3.6) + ' km/h';
      document.getElementById('locationDisplay').innerHTML =
        '<div>Lat: ' + lat + '°</div>' +
        '<div>Lon: ' + lon + '°</div>' +
        '<div>Alt: ' + alt.toLocaleString() + ' m</div>';
    }

    // Flight simulation
    viewer.clock.onTick.addEventListener(function(clock) {
      const deltaTime = Cesium.JulianDate.secondsDifference(clock.currentTime, clock.previousTime);

      // Calculate new position
      const cartographic = Cesium.Cartographic.fromCartesian(position);
      const lat = cartographic.latitude;
      const lon = cartographic.longitude;
      const alt = cartographic.height;

      // Update position based on heading and pitch
      const distance = speed * deltaTime;
      const deltaLat = Math.cos(heading) * Math.cos(pitch) * distance / 111320;
      const deltaLon = Math.sin(heading) * Math.cos(pitch) * distance / (111320 * Math.cos(lat));
      const deltaAlt = Math.sin(pitch) * distance;

      const newLat = lat + deltaLat;
      const newLon = lon + deltaLon;
      const newAlt = Math.max(100, alt + deltaAlt); // Minimum altitude 100m

      position = Cesium.Cartesian3.fromRadians(newLon, newLat, newAlt);
      planeModel.position = position;

      // Update orientation
      const hpr = new Cesium.HeadingPitchRoll(heading, pitch, 0);
      planeModel.orientation = Cesium.Transforms.headingPitchRollQuaternion(position, hpr);

      // Update camera
      const offset = new Cesium.Cartesian3(-100, 0, 30);
      viewer.camera.lookAt(position, offset);

      updateDisplay();
    });

    // Controls - both touch and click
    const forwardBtn = document.getElementById('forwardBtn');
    const leftBtn = document.getElementById('leftBtn');
    const rightBtn = document.getElementById('rightBtn');
    const upBtn = document.getElementById('upBtn');
    const downBtn = document.getElementById('downBtn');

    function addControlListeners(element, handler) {
      element.addEventListener('touchstart', handler);
      element.addEventListener('click', handler);
    }

    addControlListeners(forwardBtn, function(e) {
      e.preventDefault();
      speed = Math.min(300, speed + 10);
    });

    addControlListeners(leftBtn, function(e) {
      e.preventDefault();
      heading -= 0.1;
    });

    addControlListeners(rightBtn, function(e) {
      e.preventDefault();
      heading += 0.1;
    });

    addControlListeners(upBtn, function(e) {
      e.preventDefault();
      pitch = Math.min(Math.PI / 4, pitch + 0.05);
    });

    addControlListeners(downBtn, function(e) {
      e.preventDefault();
      pitch = Math.max(-Math.PI / 4, pitch - 0.05);
    });

    // Start simulation
    viewer.clock.shouldAnimate = true;

    // Ensure camera is unlocked
    viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);

    updateDisplay();
  </script>
</body>
</html>
    `;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Ionicons name="airplane" size={28} color="#60A5FA" />
          <Text style={styles.headerTitle}>Flight Simulator</Text>
        </View>
        <Text style={styles.headerSubtitle}>
          Explore the world with Cesium Flight Simulator
        </Text>
      </View>

      {/* Cesium Flight Simulator */}
      <View style={styles.simulatorContainer}>
        <WebView
          source={{ html: getCesiumFlightHTML() }}
          style={styles.webview}
          onLoadStart={() => setIsLoading(true)}
          onLoadEnd={() => setIsLoading(false)}
          scrollEnabled={false}
          bounces={false}
          javaScriptEnabled={true}
          domStorageEnabled={true}
        />
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#60A5FA" />
            <Text style={styles.loadingText}>Loading Flight Simulator...</Text>
          </View>
        )}
      </View>

      {/* Instructions */}
      <View style={styles.instructions}>
        <TouchableOpacity
          style={styles.instructionsToggle}
          onPress={() => setShowControls(!showControls)}
        >
          <Ionicons name="information-circle" size={20} color="#60A5FA" />
          <Text style={styles.instructionsText}>How to fly</Text>
          <Ionicons
            name={showControls ? "chevron-up" : "chevron-down"}
            size={20}
            color="#94A3B8"
          />
        </TouchableOpacity>
        {showControls && (
          <View style={styles.instructionsContent}>
            <Text style={styles.instructionItem}>▲ Forward - Increase speed</Text>
            <Text style={styles.instructionItem}>← → - Turn left/right</Text>
            <Text style={styles.instructionItem}>↑ ↓ - Climb/descend</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F3F4F6',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    lineHeight: 20,
  },
  simulatorContainer: {
    flex: 1,
    position: 'relative',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    gap: 12,
  },
  loadingText: {
    color: '#F3F4F6',
    fontSize: 16,
    fontWeight: '600',
  },
  instructions: {
    backgroundColor: '#1E293B',
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  instructionsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 8,
  },
  instructionsText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#F3F4F6',
  },
  instructionsContent: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 8,
  },
  instructionItem: {
    fontSize: 14,
    color: '#94A3B8',
    lineHeight: 20,
  },
});
