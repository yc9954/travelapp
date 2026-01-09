import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { lumaGalleryAssets } from '../../services/mockData';

const { width } = Dimensions.get('window');
const GRID_ITEM_SIZE = (width - 48) / 3;

export default function UploadScreen() {
  const [showLumaGallery, setShowLumaGallery] = useState(false);
  const [selectedLumaAsset, setSelectedLumaAsset] = useState<typeof lumaGalleryAssets[0] | null>(null);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('권한 필요', '사진을 선택하려면 갤러리 접근 권한이 필요합니다.');
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
      Alert.alert('권한 필요', '사진을 촬영하려면 카메라 접근 권한이 필요합니다.');
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

  const handleLumaAssetSelect = (asset: typeof lumaGalleryAssets[0]) => {
    setSelectedLumaAsset(asset);
  };

  const handleUseLumaAsset = () => {
    if (!selectedLumaAsset) {
      Alert.alert('알림', 'Luma 에셋을 선택해주세요.');
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

  const renderLumaAsset = ({ item }: { item: typeof lumaGalleryAssets[0] }) => {
    const isSelected = selectedLumaAsset?.id === item.id;

    return (
      <TouchableOpacity
        style={styles.lumaAssetItem}
        onPress={() => handleLumaAssetSelect(item)}
      >
        <Image source={{ uri: item.thumbnail }} style={styles.lumaAssetImage} />
        {isSelected && (
          <View style={styles.selectedOverlay}>
            <Ionicons name="checkmark-circle" size={32} color="#60A5FA" />
          </View>
        )}
        <View style={styles.lumaBadge}>
          <Text style={styles.lumaBadgeText}>3D</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Upload</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* 메인 업로드 옵션 */}
        <View style={styles.mainOptions}>
          <Text style={styles.sectionTitle}>에셋 선택</Text>
          <Text style={styles.sectionDescription}>
            가우시안 스플래팅 에셋을 선택하거나 새로 촬영하세요
          </Text>

          <View style={styles.optionsGrid}>
            <TouchableOpacity style={styles.optionCard} onPress={() => setShowLumaGallery(true)}>
              <View style={styles.optionIconContainer}>
                <Ionicons name="cube-outline" size={48} color="#60A5FA" />
              </View>
              <Text style={styles.optionTitle}>Luma 갤러리</Text>
              <Text style={styles.optionDescription}>
                실제 가우시안 스플래팅 에셋 선택
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.optionCard} onPress={takePhoto}>
              <View style={styles.optionIconContainer}>
                <Ionicons name="camera" size={48} color="#34D399" />
              </View>
              <Text style={styles.optionTitle}>촬영하기</Text>
              <Text style={styles.optionDescription}>
                카메라로 새로운 사진 촬영
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.optionCard} onPress={pickImage}>
              <View style={styles.optionIconContainer}>
                <Ionicons name="images" size={48} color="#FBBF24" />
              </View>
              <Text style={styles.optionTitle}>갤러리</Text>
              <Text style={styles.optionDescription}>
                기기의 사진 선택
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Luma 기능 소개 */}
        <View style={styles.featuresSection}>
          <Text style={styles.featuresTitle}>Luma 편집 기능</Text>

          <View style={styles.featureCard}>
            <View style={styles.featureIcon}>
              <Ionicons name="layers-outline" size={24} color="#60A5FA" />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>배경 제거</Text>
              <Text style={styles.featureDescription}>
                시맨틱 레이어 필터링으로 배경 분리
              </Text>
            </View>
          </View>

          <View style={styles.featureCard}>
            <View style={styles.featureIcon}>
              <Ionicons name="text-outline" size={24} color="#60A5FA" />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>텍스트 오버레이</Text>
              <Text style={styles.featureDescription}>
                이미지에 커스텀 텍스트 추가
              </Text>
            </View>
          </View>

          <View style={styles.featureCard}>
            <View style={styles.featureIcon}>
              <Ionicons name="color-palette-outline" size={24} color="#60A5FA" />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>커스텀 셰이더</Text>
              <Text style={styles.featureDescription}>
                GLSL 셰이더로 고급 효과 적용
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Luma 갤러리 모달 */}
      <Modal
        visible={showLumaGallery}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowLumaGallery(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Luma 갤러리</Text>
            <TouchableOpacity onPress={() => setShowLumaGallery(false)}>
              <Ionicons name="close" size={24} color="#F3F4F6" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.galleryDescription}>
              실제 Luma Gaussian Splatting 에셋을 선택하세요
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
                  {selectedLumaAsset ? '선택 완료' : '에셋을 선택하세요'}
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
    backgroundColor: '#0F172A',
  },
  header: {
    backgroundColor: '#1E293B',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F3F4F6',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  mainOptions: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F3F4F6',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 16,
  },
  optionsGrid: {
    gap: 16,
  },
  optionCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#334155',
  },
  optionIconContainer: {
    marginBottom: 12,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F3F4F6',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
  },
  featuresSection: {
    marginBottom: 32,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F3F4F6',
    marginBottom: 16,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(96, 165, 250, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F3F4F6',
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 14,
    color: '#94A3B8',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    backgroundColor: '#1E293B',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F3F4F6',
  },
  modalContent: {
    flex: 1,
  },
  galleryDescription: {
    fontSize: 14,
    color: '#94A3B8',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  lumaGalleryGrid: {
    padding: 12,
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
    backgroundColor: '#1E293B',
  },
  selectedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(96, 165, 250, 0.2)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
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
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    backgroundColor: '#1E293B',
  },
  selectedInfo: {
    marginBottom: 12,
  },
  selectedInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F3F4F6',
  },
  selectedInfoSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
  },
  selectButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  selectButtonDisabled: {
    backgroundColor: '#475569',
  },
  selectButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
