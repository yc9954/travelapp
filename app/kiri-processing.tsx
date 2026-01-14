import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { kiriService } from '../services/kiri';
import type { KiriTaskStatus } from '../services/kiri';
import { supabase } from '../lib/supabase';

export default function KiriProcessingScreen() {
  const params = useLocalSearchParams<{ 
    serialize: string;
    videoUri?: string;
  }>();
  
  const [status, setStatus] = useState<KiriTaskStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (params.serialize) {
      // Try to get task from Supabase first
      loadTaskFromDB();
      // Set up Realtime subscription
      setupRealtimeSubscription();
      // Also start polling as fallback
      startPolling();
    } else {
      setError('No task ID provided');
      setIsLoading(false);
    }

    return () => {
      // Cleanup subscription
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [params.serialize]);

  const loadTaskFromDB = async () => {
    try {
      const task = await kiriService.getTaskFromDB(params.serialize || '');
      if (task) {
        setStatus({
          serialize: task.serialize,
          status: task.status as any,
          progress: task.progress,
          downloadUrl: task.download_url,
          error: task.error_message,
        });

        // If completed, navigate immediately
        if (task.status === 'completed' && task.download_url) {
          router.replace({
            pathname: '/edit-asset',
            params: {
              imageUrl: params.videoUri || '',
              captureUrl: task.download_url,
              isLuma: 'true',
              isKiri: 'true',
            },
          });
        }
      }
    } catch (error) {
      console.error('Failed to load task from DB:', error);
    }
  };

  const setupRealtimeSubscription = () => {
    if (!params.serialize) return;

    const unsubscribe = kiriService.subscribeToTask(params.serialize || '', (task) => {
      setStatus({
        serialize: task.serialize,
        status: task.status,
        progress: task.progress,
        downloadUrl: task.download_url,
        error: task.error_message,
      });

      // If completed, navigate immediately
      if (task.status === 'completed' && task.download_url) {
        router.replace({
          pathname: '/edit-asset',
          params: {
            imageUrl: params.videoUri || '',
            captureUrl: task.download_url,
            isLuma: 'true',
            isKiri: 'true',
          },
        });
      }
    });

    unsubscribeRef.current = unsubscribe;
  };

  const startPolling = async () => {
    if (!params.serialize) return;

    try {
      setIsLoading(true);
      setError(null);

      // Wait for completion with polling
      const result = await kiriService.waitForCompletion(
        params.serialize,
        60, // max attempts (5 minutes with 5s intervals)
        5000 // 5 second intervals
      );

      setStatus(result);
      
      if (result.status === 'completed' && result.downloadUrl) {
        // Navigate to edit screen with the result
        router.replace({
          pathname: '/edit-asset',
          params: {
            imageUrl: params.videoUri || '', // Use video thumbnail as preview
            captureUrl: result.downloadUrl,
            isLuma: 'true',
            isKiri: 'true',
          },
        });
      }
    } catch (err: any) {
      console.error('KIRI processing error:', err);
      setError(err.message || 'Failed to process video');
      setStatus({
        serialize: params.serialize || '',
        status: 'failed',
        error: err.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Processing',
      'Are you sure you want to cancel? The processing will continue in the background.',
      [
        { text: 'Continue Processing', style: 'cancel' },
        {
          text: 'Go Back',
          style: 'destructive',
          onPress: () => router.back(),
        },
      ]
    );
  };

  const getStatusMessage = () => {
    if (error) return error;
    if (!status) return 'Initializing...';
    
    switch (status.status) {
      case 'pending':
        return 'Video uploaded, waiting to start processing...';
      case 'processing':
        return status.progress 
          ? `Processing... ${status.progress}%`
          : 'Processing your video into 3D model...';
      case 'completed':
        return 'Processing completed!';
      case 'failed':
        return status.error || 'Processing failed';
      default:
        return 'Processing...';
    }
  };

  const getStatusIcon = () => {
    if (error || status?.status === 'failed') {
      return <Ionicons name="alert-circle" size={64} color="#EF4444" />;
    }
    if (status?.status === 'completed') {
      return <Ionicons name="checkmark-circle" size={64} color="#10B981" />;
    }
    return <ActivityIndicator size="large" color="#6366F1" />;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Processing Video</Text>
        <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
          <Ionicons name="close" size={24} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.statusContainer}>
          {getStatusIcon()}
          <Text style={styles.statusText}>{getStatusMessage()}</Text>
          
          {status?.serialize && (
            <Text style={styles.taskId}>Task ID: {status.serialize.substring(0, 8)}...</Text>
          )}

          {status?.status === 'processing' && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${status.progress || 0}%` }
                  ]} 
                />
              </View>
            </View>
          )}
        </View>

        <View style={styles.infoContainer}>
          <View style={styles.infoCard}>
            <Ionicons name="information-circle-outline" size={24} color="#6366F1" />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>What's happening?</Text>
              <Text style={styles.infoDescription}>
                Your video is being processed into a 3D Gaussian Splatting model. 
                This may take a few minutes depending on video length and complexity.
              </Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <Ionicons name="time-outline" size={24} color="#6366F1" />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Estimated time</Text>
              <Text style={styles.infoDescription}>
                Typically 2-5 minutes for a 1-3 minute video
              </Text>
            </View>
          </View>
        </View>

        {error && (
          <TouchableOpacity
            style={styles.retryButton}
            onPress={startPolling}
          >
            <Ionicons name="refresh" size={20} color="#FFFFFF" />
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  cancelButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 24,
    textAlign: 'center',
  },
  taskId: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
    fontFamily: 'monospace',
  },
  progressContainer: {
    width: '100%',
    marginTop: 24,
    paddingHorizontal: 20,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366F1',
    borderRadius: 4,
  },
  infoContainer: {
    gap: 16,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366F1',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 24,
    gap: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
