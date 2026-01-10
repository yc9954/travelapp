import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';

export default function TravelScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [destination, setDestination] = useState('');

  const getEarth3DHTML = () => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>3D Earth Explorer</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; font-family: Arial, sans-serif; }
    body { background: linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #334155 100%); }
    #canvas-container { width: 100%; height: 100%; }
    canvas { display: block; width: 100%; height: 100%; touch-action: none; }
    .info {
      position: absolute;
      top: 20px;
      left: 20px;
      color: white;
      font-family: Arial, sans-serif;
      background: rgba(0, 0, 0, 0.7);
      padding: 15px 20px;
      border-radius: 12px;
      backdrop-filter: blur(10px);
      z-index: 100;
    }
    .title {
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    .subtitle {
      font-size: 14px;
      opacity: 0.8;
    }
  </style>
</head>
<body>
  <div id="canvas-container"></div>
  <div class="info">
    <div class="title">🌍 3D Earth Explorer</div>
    <div class="subtitle">Drag to rotate • Pinch to zoom</div>
  </div>

  <script type="importmap">
    {
      "imports": {
        "three": "https://unpkg.com/three@0.157.0/build/three.module.js",
        "three/examples/jsm/controls/OrbitControls": "https://unpkg.com/three@0.157.0/examples/jsm/controls/OrbitControls.js"
      }
    }
  </script>
  <script type="module">
    import * as THREE from 'three';
    import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 3;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x000000, 0);
    document.getElementById('canvas-container').appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 3, 5);
    scene.add(directionalLight);

    // Create Earth
    const earthGeometry = new THREE.SphereGeometry(1, 64, 64);

    // Earth material with blue color and some detail
    const earthMaterial = new THREE.MeshPhongMaterial({
      color: 0x2E86DE,
      emissive: 0x112244,
      specular: 0x333333,
      shininess: 25,
    });

    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    scene.add(earth);

    // Add land masses as wireframe
    const landGeometry = new THREE.SphereGeometry(1.01, 32, 32);
    const landMaterial = new THREE.MeshBasicMaterial({
      color: 0x44DD44,
      wireframe: true,
      transparent: true,
      opacity: 0.3,
    });
    const land = new THREE.Mesh(landGeometry, landMaterial);
    scene.add(land);

    // Atmosphere glow
    const glowGeometry = new THREE.SphereGeometry(1.15, 64, 64);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0x60A5FA,
      transparent: true,
      opacity: 0.15,
      side: THREE.BackSide,
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    scene.add(glow);

    // Stars background
    const starsGeometry = new THREE.BufferGeometry();
    const starsMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.02,
      transparent: true,
      opacity: 0.8
    });
    const starsVertices = [];
    for (let i = 0; i < 2000; i++) {
      const x = (Math.random() - 0.5) * 2000;
      const y = (Math.random() - 0.5) * 2000;
      const z = (Math.random() - 0.5) * 2000;
      starsVertices.push(x, y, z);
    }
    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);

    // Add clouds
    const cloudsGeometry = new THREE.SphereGeometry(1.02, 64, 64);
    const cloudsMaterial = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.15,
    });
    const clouds = new THREE.Mesh(cloudsGeometry, cloudsMaterial);
    scene.add(clouds);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;
    controls.enableRotate = true;
    controls.enablePan = false;
    controls.minDistance = 1.5;
    controls.maxDistance = 5;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;

    // Animation loop
    function animate() {
      requestAnimationFrame(animate);

      // Rotate Earth and clouds
      earth.rotation.y += 0.001;
      land.rotation.y += 0.001;
      clouds.rotation.y += 0.0015;

      // Slowly rotate stars
      stars.rotation.y += 0.0001;

      controls.update();
      renderer.render(scene, camera);
    }

    // Handle window resize
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Start animation
    animate();
  </script>
</body>
</html>
    `;
  };

  const quickDestinations = [
    { name: 'Seoul', emoji: '🇰🇷' },
    { name: 'Paris', emoji: '🇫🇷' },
    { name: 'Tokyo', emoji: '🇯🇵' },
    { name: 'New York', emoji: '🇺🇸' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Ionicons name="globe-outline" size={28} color="#60A5FA" />
          <Text style={styles.headerTitle}>Travel Explorer</Text>
        </View>
        <Text style={styles.headerSubtitle}>
          Explore Gaussian Splatting scenes around the world
        </Text>
      </View>

      {/* 3D Earth View */}
      <View style={styles.earthContainer}>
        <WebView
          source={{ html: getEarth3DHTML() }}
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
            <Text style={styles.loadingText}>Loading 3D Earth...</Text>
          </View>
        )}
      </View>

      {/* Search and Quick Destinations */}
      <View style={styles.bottomSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search location..."
            placeholderTextColor="#94A3B8"
            value={destination}
            onChangeText={setDestination}
          />
          {destination.length > 0 && (
            <TouchableOpacity onPress={() => setDestination('')}>
              <Ionicons name="close-circle" size={20} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.quickDestinations}>
          <Text style={styles.quickTitle}>Popular Destinations</Text>
          <View style={styles.destinationChips}>
            {quickDestinations.map((dest) => (
              <TouchableOpacity
                key={dest.name}
                style={styles.chip}
                onPress={() => setDestination(dest.name)}
              >
                <Text style={styles.chipEmoji}>{dest.emoji}</Text>
                <Text style={styles.chipText}>{dest.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
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
  earthContainer: {
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
  bottomSection: {
    backgroundColor: '#1E293B',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#F3F4F6',
  },
  quickDestinations: {
    gap: 12,
  },
  quickTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
  },
  destinationChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 6,
  },
  chipEmoji: {
    fontSize: 16,
  },
  chipText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '500',
  },
});
