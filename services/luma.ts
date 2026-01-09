import axios from 'axios';
import { delay } from './mockData';
import type { LumaConvertRequest, LumaConvertResponse } from '../types';

// Mock 모드 활성화 (Luma API 없이 테스트하려면 true로 설정)
const USE_MOCK_LUMA = true;

const LUMA_API_KEY = 'your_luma_api_key_here';
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
    if (USE_MOCK_LUMA) {
      await delay(800);
      return {
        taskId: 'mock_task_' + Date.now(),
        status: 'processing',
      };
    }

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
    if (USE_MOCK_LUMA) {
      await delay(500);
      return {
        taskId,
        status: 'completed',
        image3dUrl: 'mock_3d_url',
      };
    }

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
    if (USE_MOCK_LUMA) {
      // Mock: 3초 후 변환 완료 시뮬레이션 (원본 이미지 그대로 반환)
      await delay(3000);
      return originalUrl || 'mock_3d_conversion_completed';
    }

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
