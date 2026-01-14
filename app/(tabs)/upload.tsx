import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { lumaGalleryAssets } from '../../services/mockData';
import { kiriService } from '../../services/kiri';
import { useAuth } from '../../contexts/AuthContext';

const { width } = Dimensions.get('window');
const GRID_ITEM_SIZE = (width - 48) / 3;

export default function UploadScreen() {
  const { user } = useAuth();
  const [showLumaGallery, setShowLumaGallery] = useState(false);
  const [selectedLumaAsset, setSelectedLumaAsset] = useState<typeof lumaGalleryAssets[0] | null>(null);
  const [isProcessingVideo, setIsProcessingVideo] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Gallery access is required to select photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      router.push({
        pathname: '/edit-asset',
        params: {
          imageUrl: result.assets[0].uri,
          isLuma: 'false',
        },
      });
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera access is required to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      router.push({
        pathname: '/edit-asset',
        params: {
          imageUrl: result.assets[0].uri,
          isLuma: 'false',
        },
      });
    }
  };

  const recordVideo = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera access is required to record videos.');
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['videos'],
        allowsEditing: false,
        quality: 0.8,
        videoMaxDuration: 180, // 3 minutes max (KIRI Engine limit)
      });

      if (!result.canceled && result.assets[0]) {
        const videoUri = result.assets[0].uri;
        
        // Validate video duration
        // expo-image-picker duration is in seconds, but check if it might be in milliseconds
        if (result.assets[0].duration) {
          let durationInSeconds = result.assets[0].duration;
          
          // If duration is greater than 1000, it's likely in milliseconds
          if (durationInSeconds > 1000) {
            durationInSeconds = durationInSeconds / 1000;
          }
          
          console.log('Video duration:', durationInSeconds, 'seconds');
          
          // 3 minutes = 180 seconds
          if (durationInSeconds > 180) {
            Alert.alert('Video Too Long', 'Video must be 3 minutes or less.');
            return;
          }
        }

        setIsProcessingVideo(true);
        
        try {
          // Optional: Set webhook URL if you have a backend server
          // const webhookUrl = 'https://your-backend.com/api/webhooks/kiri';
          
          // Upload video to KIRI Engine
          // If user is logged in, task will be saved to Supabase and webhook will be set up automatically
          const uploadResponse = await kiriService.uploadVideo({
            videoFile: videoUri,
            modelQuality: 0, // High quality
            textureQuality: 0, // 4K
            fileFormat: 'glb', // GLB format for web viewing
            isMask: 1, // Enable auto object masking
            textureSmoothing: 1, // Enable texture smoothing
          }, user?.id);

          // Navigate to processing screen
          router.push({
            pathname: '/kiri-processing',
            params: {
              serialize: uploadResponse.data.serialize,
              videoUri: videoUri,
            },
          });
        } catch (error: any) {
          console.error('KIRI upload error:', error);
          Alert.alert(
            'Upload Failed',
            error.message || 'Failed to upload video to KIRI Engine. Please check your API key and try again.'
          );
        } finally {
          setIsProcessingVideo(false);
        }
      }
    } catch (error: any) {
      console.error('Video recording error:', error);
      Alert.alert('Error', 'Failed to record video. Please try again.');
    }
  };

  const handleLumaAssetSelect = (asset: typeof lumaGalleryAssets[0]) => {
    setSelectedLumaAsset(asset);
  };

  const handleUseLumaAsset = () => {
    if (!selectedLumaAsset) {
      Alert.alert('Notice', 'Please select a Luma asset.');
      return;
    }

    setShowLumaGallery(false);
    router.push({
      pathname: '/edit-asset',
      params: {
        imageUrl: selectedLumaAsset.thumbnail,
        captureUrl: selectedLumaAsset.captureUrl,
        isLuma: 'true',
      },
    });
  };

  const LumaAssetItem = ({ item, isSelected, onPress }: { 
    item: typeof lumaGalleryAssets[0]; 
    isSelected: boolean; 
    onPress: () => void;
  }) => {
    const [imageLoading, setImageLoading] = useState(true);
    const [imageError, setImageError] = useState(false);

    return (
      <TouchableOpacity
        style={styles.lumaAssetItem}
        onPress={onPress}
        activeOpacity={0.8}
      >
        {imageLoading && (
          <View style={styles.imageLoadingContainer}>
            <ActivityIndicator size="small" color="#9CA3AF" />
          </View>
        )}
        {imageError ? (
          <View style={styles.imageErrorContainer}>
            <Ionicons name="image-outline" size={32} color="#D1D5DB" />
          </View>
        ) : (
          <Image 
            key={item.thumbnail}
            source={{ uri: item.thumbnail }} 
            style={styles.lumaAssetImage}
            resizeMode="cover"
            onLoadStart={() => setImageLoading(true)}
            onLoadEnd={() => setImageLoading(false)}
            onError={() => {
              setImageLoading(false);
              setImageError(true);
            }}
          />
        )}
        {isSelected && (
          <View style={styles.selectedOverlay}>
            <Ionicons name="checkmark-circle" size={32} color="#60A5FA" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderLumaAsset = ({ item }: { item: typeof lumaGalleryAssets[0] }) => {
    const isSelected = selectedLumaAsset?.id === item.id;

    return (
      <LumaAssetItem
        item={item}
        isSelected={isSelected}
        onPress={() => handleLumaAssetSelect(item)}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Upload</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Main upload options */}
        <View style={styles.mainOptions}>
          <View style={styles.optionsGrid}>
            <TouchableOpacity style={styles.optionCard} onPress={() => setShowLumaGallery(true)}>
              <View style={styles.optionIconContainer}>
                <Ionicons name="cube-outline" size={32} color="#1F2937" />
              </View>
              <Text style={styles.optionTitle}>Luma</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.optionCard} 
              onPress={takePhoto}
              disabled={isProcessingVideo}
            >
              <View style={styles.optionIconContainer}>
                <Ionicons name="camera" size={32} color="#1F2937" />
              </View>
              <Text style={styles.optionTitle}>Camera</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.optionCard} onPress={pickImage}>
              <View style={styles.optionIconContainer}>
                <Ionicons name="images" size={32} color="#1F2937" />
              </View>
              <Text style={styles.optionTitle}>Gallery</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Edit Features */}
        <View style={styles.featuresSection}>
          <Text style={styles.featuresTitle}>Edit Features</Text>

          <TouchableOpacity
            style={[styles.featureCard, isProcessingVideo && styles.featureCardDisabled]}
            onPress={recordVideo}
            disabled={isProcessingVideo}
          >
            <View style={styles.featureIcon}>
              {isProcessingVideo ? (
                <ActivityIndicator size="small" color="#1F2937" />
              ) : (
                <Ionicons name="videocam-outline" size={24} color="#1F2937" />
              )}
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>
                {isProcessingVideo ? 'Processing Video...' : 'Record Video'}
              </Text>
              <Text style={styles.featureDescription}>
                Create 3D Gaussian Splatting from video (up to 3 min)
              </Text>
            </View>
          </TouchableOpacity>

          <View style={styles.featureCard}>
            <View style={styles.featureIcon}>
              <Ionicons name="layers-outline" size={24} color="#1F2937" />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Remove Background</Text>
              <Text style={styles.featureDescription}>
                Separate background with semantic layer filtering
              </Text>
            </View>
          </View>

          <View style={styles.featureCard}>
            <View style={styles.featureIcon}>
              <Ionicons name="text-outline" size={24} color="#1F2937" />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Text Overlay</Text>
              <Text style={styles.featureDescription}>
                Add custom text to image
              </Text>
            </View>
          </View>

          <View style={styles.featureCard}>
            <View style={styles.featureIcon}>
              <Ionicons name="color-palette-outline" size={24} color="#1F2937" />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Custom Shader</Text>
              <Text style={styles.featureDescription}>
                Apply advanced effects with GLSL shaders
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Luma gallery modal */}
      <Modal
        visible={showLumaGallery}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowLumaGallery(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Luma Gallery</Text>
            <TouchableOpacity onPress={() => setShowLumaGallery(false)}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.galleryDescription}>
              Select a real Luma Gaussian Splatting asset
            </Text>

            <FlatList
              data={lumaGalleryAssets}
              renderItem={renderLumaAsset}
              keyExtractor={(item) => item.id}
              numColumns={3}
              contentContainerStyle={styles.lumaGalleryGrid}
            />

            <View style={styles.modalActions}>
              {selectedLumaAsset && (
                <View style={styles.selectedInfo}>
                  <Text style={styles.selectedInfoTitle}>{selectedLumaAsset.name}</Text>
                  <Text style={styles.selectedInfoSubtitle}>Gaussian Splatting</Text>
                </View>
              )}
              <TouchableOpacity
                style={[styles.selectButton, !selectedLumaAsset && styles.selectButtonDisabled]}
                onPress={handleUseLumaAsset}
                disabled={!selectedLumaAsset}
              >
                <Text style={styles.selectButtonText}>
                  {selectedLumaAsset ? 'Done' : 'Select an asset'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
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
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  content: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  contentContainer: {
    padding: 20,
  },
  mainOptions: {
    marginBottom: 40,
  },
  optionsGrid: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  optionCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: '#E5E7EB',
    minHeight: 110,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  optionIconContainer: {
    marginBottom: 8,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  featuresSection: {
    marginBottom: 40,
  },
  featuresTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 0.5,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  featureDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  featureCardDisabled: {
    opacity: 0.6,
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
    backgroundColor: '#FFFFFF',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -0.3,
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  galleryDescription: {
    fontSize: 15,
    color: '#6B7280',
    paddingHorizontal: 20,
    paddingVertical: 16,
    lineHeight: 22,
  },
  lumaGalleryGrid: {
    padding: 12,
    backgroundColor: '#FFFFFF',
  },
  lumaAssetItem: {
    width: GRID_ITEM_SIZE,
    height: GRID_ITEM_SIZE,
    margin: 4,
    position: 'relative',
  },
  lumaAssetImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  imageLoadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
  },
  imageErrorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
  },
  selectedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(96, 165, 250, 0.15)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: '#60A5FA',
  },
  lumaBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  lumaBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  modalActions: {
    padding: 20,
    borderTopWidth: 0.5,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  selectedInfo: {
    marginBottom: 16,
  },
  selectedInfoTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.2,
  },
  selectedInfoSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  selectButton: {
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
  selectButtonDisabled: {
    backgroundColor: '#D1D5DB',
    shadowOpacity: 0,
    elevation: 0,
  },
  selectButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
