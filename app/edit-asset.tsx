import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { api } from '../services/api';
import { lumaService } from '../services/luma';

type EditMode = 'none' | 'removeBackground' | 'addText';

export default function EditAssetScreen() {
  const params = useLocalSearchParams<{ imageUrl?: string; captureUrl?: string; isLuma?: string }>();
  const [imageUrl, setImageUrl] = useState(params.imageUrl || '');
  const [captureUrl, setCaptureUrl] = useState(params.captureUrl || '');
  const [isLuma] = useState(params.isLuma === 'true');

  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [editMode, setEditMode] = useState<EditMode>('none');

  // 편집 옵션
  const [removeBackground, setRemoveBackground] = useState(false);
  const [textOverlay, setTextOverlay] = useState('');
  const [textPosition, setTextPosition] = useState<'top' | 'center' | 'bottom'>('center');

  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showEditMenu, setShowEditMenu] = useState(false);

  const handleRemoveBackground = async () => {
    setIsProcessing(true);
    try {
      // Luma API를 통한 배경 제거 (시뮬레이션)
      await new Promise(resolve => setTimeout(resolve, 1500));
      setRemoveBackground(!removeBackground);
      Alert.alert('완료', `배경 ${!removeBackground ? '제거' : '복원'}가 완료되었습니다!`);
      setShowEditMenu(false);
    } catch (error) {
      console.error('Background removal error:', error);
      Alert.alert('오류', '배경 제거에 실패했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddText = () => {
    if (!textOverlay.trim()) {
      Alert.alert('알림', '텍스트를 입력해주세요.');
      return;
    }
    setShowEditMenu(false);
    Alert.alert('완료', '텍스트가 추가되었습니다!');
  };

  const handlePost = async () => {
    if (!imageUrl || !caption) {
      Alert.alert('오류', '이미지와 캡션을 입력해주세요.');
      return;
    }

    setIsUploading(true);
    try {
      const hashtagArray = hashtags
        .split(' ')
        .filter(tag => tag.startsWith('#'))
        .map(tag => tag.substring(1));

      await api.createPost({
        imageUrl: imageUrl,
        image3dUrl: isLuma ? captureUrl : undefined,
        is3D: isLuma,
        caption: textOverlay ? `${caption}\n\n"${textOverlay}"` : caption,
        location: location || undefined,
        hashtags: hashtagArray,
      });

      Alert.alert('성공', '게시물이 업로드되었습니다!');
      router.push('/(tabs)/feed');
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('오류', '게시물 업로드에 실패했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  const editOptions = [
    {
      id: 'removeBackground',
      title: removeBackground ? '배경 복원' : '배경 제거',
      icon: 'layers-outline' as const,
      description: 'Luma 시맨틱 레이어 필터링',
      onPress: handleRemoveBackground,
    },
    {
      id: 'addText',
      title: '텍스트 추가',
      icon: 'text-outline' as const,
      description: '이미지에 텍스트 오버레이',
      onPress: () => setEditMode('addText'),
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>에셋 편집</Text>
        <TouchableOpacity onPress={() => setShowEditMenu(true)} style={styles.editButton}>
          <Ionicons name="create-outline" size={24} color="#6366F1" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: imageUrl }} style={styles.image} />

          {/* 배경 제거 효과 시뮬레이션 */}
          {removeBackground && (
            <View style={styles.backgroundOverlay}>
              <Text style={styles.overlayText}>배경 제거됨</Text>
            </View>
          )}

          {/* 텍스트 오버레이 */}
          {textOverlay && (
            <View style={[styles.textOverlay, styles[`textOverlay${textPosition.charAt(0).toUpperCase() + textPosition.slice(1)}` as keyof typeof styles]]}>
              <Text style={styles.overlayTextContent}>{textOverlay}</Text>
            </View>
          )}

          {isLuma && (
            <View style={styles.badge3D}>
              <Text style={styles.badge3DText}>3D</Text>
            </View>
          )}
        </View>

        {/* 편집 메뉴 */}
        <Modal
          visible={showEditMenu}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowEditMenu(false)}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>편집 옵션</Text>
              <TouchableOpacity onPress={() => setShowEditMenu(false)}>
                <Ionicons name="close" size={24} color="#1F2937" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={editOptions}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.editOption}
                  onPress={item.onPress}
                  disabled={isProcessing}
                >
                  <View style={styles.editOptionIcon}>
                    <Ionicons name={item.icon} size={24} color="#6366F1" />
                  </View>
                  <View style={styles.editOptionContent}>
                    <Text style={styles.editOptionTitle}>{item.title}</Text>
                    <Text style={styles.editOptionDescription}>{item.description}</Text>
                  </View>
                  {isProcessing && (
                    <ActivityIndicator size="small" color="#6366F1" />
                  )}
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.editOptionsList}
            />

            {/* 텍스트 추가 입력 영역 */}
            {editMode === 'addText' && (
              <View style={styles.textInputSection}>
                <TextInput
                  style={styles.textInput}
                  placeholder="추가할 텍스트 입력..."
                  placeholderTextColor="#9CA3AF"
                  value={textOverlay}
                  onChangeText={setTextOverlay}
                  multiline
                />
                <View style={styles.textPositionSelector}>
                  <Text style={styles.textPositionLabel}>위치:</Text>
                  {(['top', 'center', 'bottom'] as const).map((pos) => (
                    <TouchableOpacity
                      key={pos}
                      style={[
                        styles.textPositionButton,
                        textPosition === pos && styles.textPositionButtonActive,
                      ]}
                      onPress={() => setTextPosition(pos)}
                    >
                      <Text
                        style={[
                          styles.textPositionButtonText,
                          textPosition === pos && styles.textPositionButtonTextActive,
                        ]}
                      >
                        {pos === 'top' ? '상단' : pos === 'center' ? '중앙' : '하단'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity style={styles.addTextButton} onPress={handleAddText}>
                  <Text style={styles.addTextButtonText}>텍스트 적용</Text>
                </TouchableOpacity>
              </View>
            )}
          </SafeAreaView>
        </Modal>

        {/* 게시물 정보 입력 */}
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="캡션을 입력하세요..."
            placeholderTextColor="#9CA3AF"
            value={caption}
            onChangeText={setCaption}
            multiline
            numberOfLines={3}
          />

          <TextInput
            style={styles.input}
            placeholder="위치 (예: 파리, 프랑스)"
            placeholderTextColor="#9CA3AF"
            value={location}
            onChangeText={setLocation}
          />

          <TextInput
            style={styles.input}
            placeholder="해시태그 (예: #가우시안스플래팅 #3D)"
            placeholderTextColor="#9CA3AF"
            value={hashtags}
            onChangeText={setHashtags}
          />

          {isLuma && (
            <View style={styles.lumaInfo}>
              <Ionicons name="information-circle" size={20} color="#6366F1" />
              <Text style={styles.lumaInfoText}>
                Luma 가우시안 스플래팅 에셋입니다. 3D 뷰어에서 감상할 수 있습니다.
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.postButton, isUploading && styles.disabledButton]}
            onPress={handlePost}
            disabled={isUploading}
          >
            {isUploading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.postButtonText}>게시</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  editButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 400,
    backgroundColor: '#F3F4F6',
  },
  backgroundOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366F1',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  textOverlay: {
    position: 'absolute',
    left: 16,
    right: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 8,
  },
  textOverlayTop: {
    top: 16,
  },
  textOverlayCenter: {
    top: '50%',
    transform: [{ translateY: -20 }],
  },
  textOverlayBottom: {
    bottom: 16,
  },
  overlayTextContent: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  badge3D: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  badge3DText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  editOptionsList: {
    padding: 16,
  },
  editOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 12,
  },
  editOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  editOptionContent: {
    flex: 1,
  },
  editOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  editOptionDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  textInputSection: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 80,
  },
  textPositionSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  textPositionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginRight: 12,
  },
  textPositionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 8,
  },
  textPositionButtonActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  textPositionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  textPositionButtonTextActive: {
    color: '#FFFFFF',
  },
  addTextButton: {
    backgroundColor: '#6366F1',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  addTextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  form: {
    padding: 16,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  lumaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
  },
  lumaInfoText: {
    flex: 1,
    fontSize: 14,
    color: '#4F46E5',
  },
  postButton: {
    backgroundColor: '#6366F1',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  postButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
});
