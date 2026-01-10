import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';

export default function TravelScreen() {
  const [destination, setDestination] = useState('');
  const [currentLocation, setCurrentLocation] = useState('Seoul, South Korea');
  const [isLoading, setIsLoading] = useState(true);

  const handleSearch = () => {
    if (destination.trim()) {
      // Trigger globe animation to destination
      console.log('Navigate to:', destination);
      setCurrentLocation(destination);
    }
  };

  const getGlobeHTML = () => {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; }
    body { background: linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #334155 100%); }
    #canvas-container { width: 100%; height: 100%; position: relative; }
    canvas { display: block; width: 100%; height: 100%; touch-action: none; }
    .info {
      position: absolute;
      top: 20px;
      left: 20px;
      color: white;
      font-family: Arial, sans-serif;
      background: rgba(0, 0, 0, 0.5);
      padding: 15px 20px;
      border-radius: 12px;
      backdrop-filter: blur(10px);
    }
    .location-name {
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    .coordinates {
      font-size: 14px;
      opacity: 0.8;
    }
  </style>
</head>
<body>
  <div id="canvas-container">
    <div class="info">
      <div class="location-name">${currentLocation}</div>
      <div class="coordinates">✈️ Exploring the world...</div>
    </div>
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
    renderer.setClearColor(0x000000, 0);
    document.getElementById('canvas-container').appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 3, 5);
    scene.add(directionalLight);

    // Create Earth
    const earthGeometry = new THREE.SphereGeometry(1, 64, 64);

    // Earth texture with realistic colors
    const earthMaterial = new THREE.MeshPhongMaterial({
      color: 0x4488ff,
      emissive: 0x112244,
      specular: 0x333333,
      shininess: 25,
      wireframe: false,
    });

    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    scene.add(earth);

    // Add continents as wireframe overlay
    const continentsGeometry = new THREE.SphereGeometry(1.01, 32, 32);
    const continentsMaterial = new THREE.MeshBasicMaterial({
      color: 0x44ff44,
      wireframe: true,
      transparent: true,
      opacity: 0.3,
    });
    const continents = new THREE.Mesh(continentsGeometry, continentsMaterial);
    scene.add(continents);

    // Atmosphere glow
    const atmosphereGeometry = new THREE.SphereGeometry(1.15, 64, 64);
    const atmosphereMaterial = new THREE.MeshBasicMaterial({
      color: 0x60A5FA,
      transparent: true,
      opacity: 0.15,
      side: THREE.BackSide,
    });
    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    scene.add(atmosphere);

    // Create airplane
    const planeGroup = new THREE.Group();

    // Fuselage
    const fuselageGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.1, 8);
    const planeMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });
    const fuselage = new THREE.Mesh(fuselageGeometry, planeMaterial);
    fuselage.rotation.z = Math.PI / 2;
    planeGroup.add(fuselage);

    // Wings
    const wingGeometry = new THREE.BoxGeometry(0.15, 0.01, 0.03);
    const wings = new THREE.Mesh(wingGeometry, planeMaterial);
    planeGroup.add(wings);

    // Tail
    const tailGeometry = new THREE.BoxGeometry(0.03, 0.05, 0.01);
    const tail = new THREE.Mesh(tailGeometry, planeMaterial);
    tail.position.set(-0.04, 0.02, 0);
    planeGroup.add(tail);

    planeGroup.position.set(1.2, 0.3, 0.5);
    planeGroup.scale.set(2, 2, 2);
    scene.add(planeGroup);

    // Stars background
    const starsGeometry = new THREE.BufferGeometry();
    const starsMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.02 });
    const starsVertices = [];
    for (let i = 0; i < 1000; i++) {
      const x = (Math.random() - 0.5) * 2000;
      const y = (Math.random() - 0.5) * 2000;
      const z = (Math.random() - 0.5) * 2000;
      starsVertices.push(x, y, z);
    }
    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;
    controls.minDistance = 1.5;
    controls.maxDistance = 5;

    // Animation variables
    let angle = 0;
    const radius = 1.3;
    const speed = 0.002;

    // Animation loop
    function animate() {
      requestAnimationFrame(animate);

      // Rotate Earth
      earth.rotation.y += 0.001;
      continents.rotation.y += 0.001;

      // Animate airplane orbit
      angle += speed;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = Math.sin(angle * 2) * 0.3;

      planeGroup.position.set(x, y, z);

      // Make airplane look ahead in flight direction
      const nextX = Math.cos(angle + 0.1) * radius;
      const nextZ = Math.sin(angle + 0.1) * radius;
      const nextY = Math.sin((angle + 0.1) * 2) * 0.3;
      planeGroup.lookAt(nextX, nextY, nextZ);

      controls.update();
      renderer.render(scene, camera);
    }

    // Handle window resize
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
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Ionicons name="airplane" size={28} color="#60A5FA" />
            <Text style={styles.headerTitle}>Travel Explorer</Text>
          </View>
          <Text style={styles.headerSubtitle}>
            Discover Gaussian Splatting scenes around the world
          </Text>
        </View>

        {/* Globe View */}
        <View style={styles.globeContainer}>
          <WebView
            source={{ html: getGlobeHTML() }}
            style={styles.webview}
            onLoadStart={() => setIsLoading(true)}
            onLoadEnd={() => setIsLoading(false)}
            scrollEnabled={false}
            bounces={false}
          />
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#60A5FA" />
            </View>
          )}
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#94A3B8" />
            <TextInput
              style={styles.searchInput}
              placeholder="Enter destination..."
              placeholderTextColor="#94A3B8"
              value={destination}
              onChangeText={setDestination}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            {destination.length > 0 && (
              <TouchableOpacity onPress={() => setDestination('')}>
                <Ionicons name="close-circle" size={20} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={[styles.searchButton, !destination.trim() && styles.searchButtonDisabled]}
            onPress={handleSearch}
            disabled={!destination.trim()}
          >
            <Ionicons name="navigate" size={20} color="#FFFFFF" />
            <Text style={styles.searchButtonText}>Explore</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Destinations */}
        <View style={styles.quickDestinations}>
          <Text style={styles.quickTitle}>Popular Destinations</Text>
          <View style={styles.destinationChips}>
            {['Paris', 'Tokyo', 'New York', 'London'].map((city) => (
              <TouchableOpacity
                key={city}
                style={styles.chip}
                onPress={() => {
                  setDestination(city);
                  setCurrentLocation(city);
                }}
              >
                <Text style={styles.chipText}>{city}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  keyboardView: {
    flex: 1,
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
  globeContainer: {
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
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#F3F4F6',
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  searchButtonDisabled: {
    backgroundColor: '#334155',
    opacity: 0.5,
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  quickDestinations: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  quickTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F3F4F6',
    marginBottom: 12,
  },
  destinationChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  chipText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '500',
  },
});
