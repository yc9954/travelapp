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
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
                <Ionicons name="cube-outline" size={48} color="#1F2937" />
              </View>
              <Text style={styles.optionTitle}>Luma 갤러리</Text>
              <Text style={styles.optionDescription}>
                실제 가우시안 스플래팅 에셋 선택
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.optionCard} onPress={takePhoto}>
              <View style={styles.optionIconContainer}>
                <Ionicons name="camera" size={48} color="#1F2937" />
              </View>
              <Text style={styles.optionTitle}>촬영하기</Text>
              <Text style={styles.optionDescription}>
                카메라로 새로운 사진 촬영
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.optionCard} onPress={pickImage}>
              <View style={styles.optionIconContainer}>
                <Ionicons name="images" size={48} color="#1F2937" />
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
              <Ionicons name="layers-outline" size={24} color="#1F2937" />
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
              <Ionicons name="text-outline" size={24} color="#1F2937" />
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
              <Ionicons name="color-palette-outline" size={24} color="#1F2937" />
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
              <Ionicons name="close" size={24} color="#6B7280" />
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
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -0.5,
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
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  sectionDescription: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 24,
    lineHeight: 22,
  },
  optionsGrid: {
    gap: 16,
  },
  optionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  optionIconContainer: {
    marginBottom: 16,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  optionDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  featuresSection: {
    marginBottom: 32,
  },
  featuresTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 20,
    letterSpacing: -0.3,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
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
    color: '#1F2937',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  featureDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
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
