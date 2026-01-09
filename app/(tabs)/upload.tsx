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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { api } from '../../services/api';
import { lumaService } from '../../services/luma';

export default function UploadScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [is3D, setIs3D] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

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
      setImageUri(result.assets[0].uri);
      setIs3D(false);
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
      setImageUri(result.assets[0].uri);
      setIs3D(false);
    }
  };

  const convertTo3D = async () => {
    if (!imageUri) return;

    setIsConverting(true);
    try {
      const uploadedUrl = await api.uploadImage(imageUri);
      const { taskId } = await lumaService.convertTo3D(uploadedUrl);
      const image3dUrl = await lumaService.waitForConversion(taskId, 30, uploadedUrl);

      setImageUri(image3dUrl);
      setIs3D(true);
      Alert.alert('성공', '3D 변환이 완료되었습니다!');
    } catch (error) {
      console.error('3D conversion error:', error);
      Alert.alert('오류', '3D 변환에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsConverting(false);
    }
  };

  const handlePost = async () => {
    if (!imageUri || !caption) {
      Alert.alert('오류', '사진과 캡션을 입력해주세요.');
      return;
    }

    setIsUploading(true);
    try {
      let uploadedUrl = imageUri;

      if (!imageUri.startsWith('http')) {
        uploadedUrl = await api.uploadImage(imageUri);
      }

      const hashtagArray = hashtags
        .split(' ')
        .filter(tag => tag.startsWith('#'))
        .map(tag => tag.substring(1));

      await api.createPost({
        imageUrl: uploadedUrl,
        image3dUrl: is3D ? uploadedUrl : undefined,
        is3D,
        caption,
        location: location || undefined,
        hashtags: hashtagArray,
      });

      Alert.alert('성공', '게시물이 업로드되었습니다!');

      setImageUri(null);
      setCaption('');
      setLocation('');
      setHashtags('');
      setIs3D(false);

      router.push('/(tabs)/feed');
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('오류', '게시물 업로드에 실패했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>새 게시물</Text>
      </View>

      <ScrollView style={styles.content}>
        {!imageUri ? (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="image-outline" size={64} color="#9CA3AF" />
            <Text style={styles.placeholderText}>사진을 선택하세요</Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.pickButton} onPress={takePhoto}>
                <Ionicons name="camera" size={24} color="#FFFFFF" />
                <Text style={styles.pickButtonText}>촬영</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.pickButton} onPress={pickImage}>
                <Ionicons name="images" size={24} color="#FFFFFF" />
                <Text style={styles.pickButtonText}>갤러리</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View>
            <Image source={{ uri: imageUri }} style={styles.image} />
            {is3D && (
              <View style={styles.badge3D}>
                <Text style={styles.badge3DText}>3D</Text>
              </View>
            )}
            <View style={styles.imageActions}>
              <TouchableOpacity
                style={styles.changeButton}
                onPress={pickImage}
              >
                <Text style={styles.changeButtonText}>사진 변경</Text>
              </TouchableOpacity>
              {!is3D && (
                <TouchableOpacity
                  style={[styles.convert3DButton, isConverting && styles.disabledButton]}
                  onPress={convertTo3D}
                  disabled={isConverting}
                >
                  {isConverting ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.convert3DButtonText}>3D로 변환</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>

            {!is3D && (
              <View style={styles.tips}>
                <Text style={styles.tipsTitle}>더 나은 3D 변환을 위한 팁:</Text>
                <Text style={styles.tipText}>✓ 밝은 조명에서 촬영하세요</Text>
                <Text style={styles.tipText}>✓ 피사체를 중앙에 배치하세요</Text>
                <Text style={styles.tipText}>✓ 가능하면 여러 각도로 찍으세요</Text>
              </View>
            )}
          </View>
        )}

        {imageUri && (
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
              placeholder="해시태그 (예: #유럽여행 #파리)"
              placeholderTextColor="#9CA3AF"
              value={hashtags}
              onChangeText={setHashtags}
            />

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
        )}
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
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  content: {
    flex: 1,
  },
  imagePlaceholder: {
    margin: 16,
    height: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  placeholderText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 24,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  pickButton: {
    backgroundColor: '#6366F1',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  pickButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  image: {
    width: '100%',
    height: 400,
    backgroundColor: '#F3F4F6',
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
  imageActions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  changeButton: {
    flex: 1,
    backgroundColor: '#E5E7EB',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  changeButtonText: {
    color: '#1F2937',
    fontSize: 16,
    fontWeight: '600',
  },
  convert3DButton: {
    flex: 1,
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  convert3DButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  tips: {
    margin: 16,
    padding: 16,
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4F46E5',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 13,
    color: '#6366F1',
    marginBottom: 4,
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
