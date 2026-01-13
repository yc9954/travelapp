import axios from 'axios';
import type { LumaConvertRequest, LumaConvertResponse } from '../types';

const LUMA_API_KEY = process.env.EXPO_PUBLIC_LUMA_API_KEY || 'your_luma_api_key_here';
const LUMA_API_URL = 'https://api.lumalabs.ai/v1';

class LumaService {
  private client;

  constructor() {
    this.client = axios.create({
      baseURL: LUMA_API_URL,
      headers: {
        'Authorization': `Bearer ${LUMA_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async convertTo3D(imageUrl: string): Promise<LumaConvertResponse> {
    try {
      const response = await this.client.post('/image-to-3d', {
        image_url: imageUrl,
      });

      return {
        taskId: response.data.task_id,
        status: 'processing',
      };
    } catch (error) {
      console.error('Luma 3D conversion error:', error);
      throw new Error('Failed to start 3D conversion');
    }
  }

  async checkConversionStatus(taskId: string): Promise<LumaConvertResponse> {
    try {
      const response = await this.client.get(`/tasks/${taskId}`);

      return {
        taskId,
        status: response.data.status,
        image3dUrl: response.data.output_url,
      };
    } catch (error) {
      console.error('Luma status check error:', error);
      throw new Error('Failed to check conversion status');
    }
  }

  async waitForConversion(taskId: string, maxAttempts: number = 30, originalUrl?: string): Promise<string> {
    for (let i = 0; i < maxAttempts; i++) {
      const result = await this.checkConversionStatus(taskId);

      if (result.status === 'completed' && result.image3dUrl) {
        return result.image3dUrl;
      }

      if (result.status === 'failed') {
        throw new Error('3D conversion failed');
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    throw new Error('3D conversion timeout');
  }
}

export const lumaService = new LumaService();
