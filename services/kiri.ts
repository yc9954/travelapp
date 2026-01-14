import axios from 'axios';
import { supabase } from '../lib/supabase';

const KIRI_API_KEY = process.env.EXPO_PUBLIC_KIRI_API_KEY || '';
const KIRI_API_URL = 'https://api.kiriengine.app/api/v1';
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';

export interface KiriVideoUploadRequest {
  videoFile: string; // Local file URI
  modelQuality?: number; // 0: High, 1: Medium, 2: Low, 3: Ultra (default: 0)
  textureQuality?: number; // 0: 4K, 1: 2K, 2: 1K, 3: 8K (default: 0)
  fileFormat?: string; // obj, fbx, stl, ply, glb, gltf, usdz, xyz (default: 'OBJ')
  isMask?: number; // 0: Off, 1: On (default: 0)
  textureSmoothing?: number; // 0: Off, 1: On (default: 0)
  webhookUrl?: string; // Optional webhook URL for status updates (see https://docs.kiriengine.app/category/webhooks)
}

export interface KiriVideoUploadResponse {
  code: number;
  msg: string;
  data: {
    serialize: string; // Unique identifier for the task
    calculateType: number; // 1: Photo Scan, 2: Featureless Object Scan, 3: 3DGS Scan
  };
  ok: boolean;
}

export interface KiriTaskStatus {
  serialize: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  downloadUrl?: string;
  error?: string;
}

class KiriService {
  private client;

  constructor() {
    this.client = axios.create({
      baseURL: KIRI_API_URL,
      headers: {
        'Authorization': `Bearer ${KIRI_API_KEY}`,
      },
    });
  }

  /**
   * Upload video to KIRI Engine for 3DGS processing
   * Reference: https://docs.kiriengine.app/photo-scan/video-upload
   * 
   * If Supabase is configured, automatically creates a task record and sets up webhook
   */
  async uploadVideo(
    request: KiriVideoUploadRequest,
    userId?: string
  ): Promise<KiriVideoUploadResponse & { taskId?: string }> {
    try {
      if (!KIRI_API_KEY || KIRI_API_KEY === '') {
        throw new Error('KIRI Engine API key is not configured. Please set EXPO_PUBLIC_KIRI_API_KEY in your .env file.');
      }

      // Create FormData
      const formData = new FormData();
      
      // Add video file
      // In React Native, we need to use the file URI directly
      const filename = request.videoFile.split('/').pop() || 'video.mp4';
      const fileType = 'video/mp4';
      
      // React Native FormData format
      formData.append('videoFile', {
        uri: request.videoFile,
        name: filename,
        type: fileType,
      } as any);

      // Add optional parameters
      formData.append('modelQuality', String(request.modelQuality ?? 0));
      formData.append('textureQuality', String(request.textureQuality ?? 0));
      formData.append('fileFormat', request.fileFormat || 'OBJ');
      formData.append('isMask', String(request.isMask ?? 0));
      formData.append('textureSmoothing', String(request.textureSmoothing ?? 0));
      
      // Set up webhook URL if Supabase is configured
      // Use Supabase Edge Function as webhook endpoint
      let webhookUrl = request.webhookUrl;
      if (!webhookUrl && SUPABASE_URL && userId) {
        // Use Supabase Edge Function for webhook
        webhookUrl = `${SUPABASE_URL}/functions/v1/kiri-webhook`;
      }
      
      // Add webhook URL if available
      // Reference: https://docs.kiriengine.app/category/webhooks
      if (webhookUrl) {
        formData.append('webhookUrl', webhookUrl);
      }

      const response = await this.client.post<KiriVideoUploadResponse>(
        '/open/photo/video',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      // Debug: Log response to understand the structure
      console.log('KIRI API Response:', JSON.stringify(response.data, null, 2));

      // Check if response indicates success
      // KIRI API may return success in different ways:
      // - code === 0 (success)
      // - ok === true (success)
      // - msg === "success" (success)
      // - HTTP status 200-299 (success)
      const isSuccess = 
        response.status >= 200 && response.status < 300 &&
        (response.data.code === 0 || 
         response.data.ok === true || 
         response.data.msg?.toLowerCase() === 'success' ||
         response.data.data?.serialize);

      if (!isSuccess) {
        throw new Error(response.data.msg || 'Failed to upload video');
      }

      // Create task record in Supabase if userId is provided
      let taskId: string | undefined;
      if (userId && SUPABASE_URL) {
        try {
          const { data: task, error } = await supabase
            .from('kiri_tasks')
            .insert({
              user_id: userId,
              serialize: response.data.data.serialize,
              video_uri: request.videoFile,
              status: 'pending',
              metadata: {
                modelQuality: request.modelQuality,
                textureQuality: request.textureQuality,
                fileFormat: request.fileFormat,
                isMask: request.isMask,
                textureSmoothing: request.textureSmoothing,
              },
            })
            .select()
            .single();

          if (error) {
            console.error('Failed to create task record:', error);
            // Don't throw - video upload succeeded, just DB record failed
          } else {
            taskId = task.id;
          }
        } catch (error) {
          console.error('Error creating task record:', error);
          // Don't throw - video upload succeeded
        }
      }

      return {
        ...response.data,
        taskId,
      };
    } catch (error: any) {
      console.error('KIRI Engine upload error:', error);
      
      // If error message is "success", it's likely a false positive
      // Check if the response actually indicates success
      if (error.response) {
        const responseData = error.response.data;
        const status = error.response.status;
        
        // If HTTP status is 200-299 and we have a serialize, it's actually a success
        if (status >= 200 && status < 300 && responseData?.data?.serialize) {
          console.log('Response indicates success despite error handling, proceeding...');
          
          // Create task record in Supabase if userId is provided
          let taskId: string | undefined;
          if (userId && SUPABASE_URL) {
            try {
              const { data: task, error } = await supabase
                .from('kiri_tasks')
                .insert({
                  user_id: userId,
                  serialize: responseData.data.serialize,
                  video_uri: request.videoFile,
                  status: 'pending',
                  metadata: {
                    modelQuality: request.modelQuality,
                    textureQuality: request.textureQuality,
                    fileFormat: request.fileFormat,
                    isMask: request.isMask,
                    textureSmoothing: request.textureSmoothing,
                  },
                })
                .select()
                .single();

              if (!error && task) {
                taskId = task.id;
              }
            } catch (dbError) {
              console.error('Error creating task record:', dbError);
            }
          }
          
          // Return the successful response
          return {
            ...responseData,
            taskId,
          };
        }
        
        // Check if msg is "success" - this might be a success response
        if (responseData?.msg?.toLowerCase() === 'success' && responseData?.data?.serialize) {
          console.log('Response msg is "success" with serialize, treating as success');
          
          // Create task record in Supabase if userId is provided
          let taskId: string | undefined;
          if (userId && SUPABASE_URL) {
            try {
              const { data: task, error } = await supabase
                .from('kiri_tasks')
                .insert({
                  user_id: userId,
                  serialize: responseData.data.serialize,
                  video_uri: request.videoFile,
                  status: 'pending',
                  metadata: {
                    modelQuality: request.modelQuality,
                    textureQuality: request.textureQuality,
                    fileFormat: request.fileFormat,
                    isMask: request.isMask,
                    textureSmoothing: request.textureSmoothing,
                  },
                })
                .select()
                .single();

              if (!error && task) {
                taskId = task.id;
              }
            } catch (dbError) {
              console.error('Error creating task record:', dbError);
            }
          }
          
          // Return the successful response
          return {
            ...responseData,
            taskId,
          };
        }
        
        throw new Error(`KIRI Engine API error: ${responseData?.msg || error.response.statusText}`);
      }
      
      // If error message itself is "success", it might be a false positive
      if (error.message?.toLowerCase() === 'success') {
        console.warn('Error message is "success" - this might be a false positive. Check API response structure.');
      }
      
      throw new Error(error.message || 'Failed to upload video to KIRI Engine');
    }
  }

  /**
   * Check the status of a KIRI Engine task
   * Reference: https://docs.kiriengine.app/
   * 
   * Note: The actual endpoint may vary. Check KIRI Engine API docs for the correct endpoint.
   * Common patterns: /open/photo/status/{serialize} or /open/photo/{serialize}
   */
  async checkTaskStatus(serialize: string): Promise<KiriTaskStatus> {
    try {
      // Try common status endpoint patterns
      let response;
      try {
        response = await this.client.get(`/open/photo/status/${serialize}`);
      } catch (e) {
        // Try alternative endpoint
        try {
          response = await this.client.get(`/open/photo/${serialize}`);
        } catch (e2) {
          // Try model endpoint
          response = await this.client.get(`/open/model/${serialize}`);
        }
      }

      // Parse response based on KIRI Engine API format
      const data = response.data?.data || response.data;
      
      return {
        serialize,
        status: this.mapStatus(data.status || data.state || 'processing'),
        progress: data.progress || data.progressPercent,
        downloadUrl: data.downloadUrl || data.url || data.modelUrl,
        error: data.error || data.errorMessage,
      };
    } catch (error: any) {
      console.error('KIRI Engine status check error:', error);
      
      // If status endpoint doesn't exist, return processing status
      // In production, use webhooks for real-time updates
      return {
        serialize,
        status: 'processing',
      };
    }
  }

  /**
   * Map KIRI Engine status values to our status type
   */
  private mapStatus(status: string): 'pending' | 'processing' | 'completed' | 'failed' {
    const normalized = status.toLowerCase();
    if (normalized.includes('complete') || normalized === 'done' || normalized === 'success') {
      return 'completed';
    }
    if (normalized.includes('fail') || normalized.includes('error')) {
      return 'failed';
    }
    if (normalized.includes('pending') || normalized === 'queued') {
      return 'pending';
    }
    return 'processing';
  }

  /**
   * Wait for task completion with polling
   * 
   * Note: For better efficiency, use webhooks instead of polling.
   * Set webhookUrl in uploadVideo() to receive real-time status updates.
   * Reference: https://docs.kiriengine.app/category/webhooks
   */
  async waitForCompletion(
    serialize: string,
    maxAttempts: number = 60,
    intervalMs: number = 5000
  ): Promise<KiriTaskStatus> {
    for (let i = 0; i < maxAttempts; i++) {
      const status = await this.checkTaskStatus(serialize);

      if (status.status === 'completed' && status.downloadUrl) {
        return status;
      }

      if (status.status === 'failed') {
        throw new Error(status.error || 'KIRI Engine processing failed');
      }

      // Wait before next check
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }

    throw new Error('KIRI Engine processing timeout');
  }

  /**
   * Get model information for a completed task
   * Reference: https://docs.kiriengine.app/model
   */
  async getModel(serialize: string): Promise<any> {
    try {
      const response = await this.client.get(`/open/model/${serialize}`);
      return response.data;
    } catch (error: any) {
      console.error('KIRI Engine get model error:', error);
      throw new Error('Failed to get model information');
    }
  }

  /**
   * Get download URL for completed task
   * This may need to be adjusted based on actual KIRI Engine API
   */
  async getDownloadUrl(serialize: string): Promise<string> {
    const status = await this.checkTaskStatus(serialize);
    
    if (status.status !== 'completed' || !status.downloadUrl) {
      throw new Error('Task is not completed yet or download URL is not available');
    }

    return status.downloadUrl;
  }

  /**
   * Get task from Supabase database
   */
  async getTaskFromDB(serialize: string) {
    if (!SUPABASE_URL) {
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('kiri_tasks')
        .select('*')
        .eq('serialize', serialize)
        .single();

      if (error) {
        console.error('Failed to get task from DB:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error getting task from DB:', error);
      return null;
    }
  }

  /**
   * Subscribe to task status updates via Supabase Realtime
   */
  subscribeToTask(
    serialize: string,
    callback: (task: any) => void
  ) {
    if (!SUPABASE_URL) {
      return null;
    }

    const channel = supabase
      .channel(`kiri-task-${serialize}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'kiri_tasks',
          filter: `serialize=eq.${serialize}`,
        },
        (payload) => {
          callback(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
}

export const kiriService = new KiriService();
