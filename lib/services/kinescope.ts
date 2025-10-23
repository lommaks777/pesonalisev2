/**
 * Kinescope API Service
 * 
 * Provides integration with Kinescope video platform API for:
 * - Fetching video lists from projects
 * - Retrieving video metadata
 * - Generating download URLs for specific qualities
 * 
 * Based on Kinescope REST API v1
 */

import axios, { AxiosInstance } from 'axios';

export interface KinescopeConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface KinescopeVideoAsset {
  quality: '360p' | '720p' | '1080p' | 'source';
  url: string;
  size?: number; // bytes
}

export interface KinescopeVideo {
  id: string;
  title: string;
  duration: number; // seconds
  status: 'processing' | 'done' | 'error';
  assets?: KinescopeVideoAsset[];
  created_at: string;
  project_id?: string;
}

export interface KinescopeProject {
  id: string;
  title: string;
  videos_count: number;
}

/**
 * Kinescope API client for video management operations
 */
export class KinescopeService {
  private client: AxiosInstance;
  private apiKey: string;

  constructor(config: KinescopeConfig) {
    this.apiKey = config.apiKey;
    
    this.client = axios.create({
      baseURL: config.baseUrl || 'https://api.kinescope.io/v1',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 seconds
    });
  }

  /**
   * Fetch all videos in a Kinescope project or folder
   * 
   * @param projectId Kinescope project ID (optional if folderId is provided)
   * @param folderId Kinescope folder ID (optional if projectId is provided)
   * @returns Array of video metadata
   * @throws Error if API request fails
   */
  async fetchProjectVideos(projectId?: string, folderId?: string): Promise<KinescopeVideo[]> {
    try {
      if (!projectId && !folderId) {
        throw new Error('Необходимо указать projectId или folderId');
      }

      console.log(`📹 Получение видео из Kinescope ${folderId ? `папки: ${folderId}` : `проекта: ${projectId}`}`);
      
      const response = await this.retryRequest(async () => {
        // Use /videos endpoint with folder_id or project_id as query parameter
        const params: any = {};
        if (folderId) {
          params.folder_id = folderId;
        } else if (projectId) {
          params.project_id = projectId;
        }
        
        params.per_page = 100; // Get more videos at once
        
        return await this.client.get('/videos', { params });
      });

      const videos = response.data.data || response.data.videos || [];
      
      // Filter out videos that aren't fully processed
      const processedVideos = videos.filter((v: KinescopeVideo) => v.status === 'done');
      
      console.log(`✅ Найдено ${processedVideos.length} обработанных видео (всего ${videos.length})`);
      
      return processedVideos;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error('Неверный API ключ Kinescope. Проверьте KINESCOPE_API_KEY в переменных окружения.');
        }
        if (error.response?.status === 404) {
          console.warn(`⚠️ Проект/папка не найдена. Возвращаем пустой массив.`);
          return [];
        }
        throw new Error(`Ошибка Kinescope API: ${error.response?.status} - ${error.response?.statusText}`);
      }
      throw error;
    }
  }

  /**
   * Get detailed information about a specific video
   * 
   * @param videoId Kinescope video UUID
   * @returns Video metadata with download assets
   */
  async getVideoDetails(videoId: string): Promise<KinescopeVideo> {
    try {
      const response = await this.retryRequest(async () => {
        return await this.client.get(`/videos/${videoId}`);
      });

      return response.data.data || response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        throw new Error(`Video ${videoId} not found`);
      }
      throw error;
    }
  }

  /**
   * Get direct download URL for a video at specified quality
   * 
   * @param videoId Kinescope video UUID
   * @param preferredQuality Desired quality (will fallback to lower if unavailable)
   * @returns Direct download URL
   */
  async getDownloadUrl(
    videoId: string, 
    preferredQuality: '360p' | '720p' | '1080p' = '360p'
  ): Promise<string> {
    try {
      console.log(`🔗 Получение URL для видео ${videoId} (качество: ${preferredQuality})`);
      
      // Get video details which includes assets with download_link
      const videoDetails = await this.getVideoDetails(videoId);
      
      if (!videoDetails.assets || videoDetails.assets.length === 0) {
        throw new Error('У видео нет доступных ассетов');
      }
      
      // Find asset with preferred quality
      let asset = videoDetails.assets.find((a: any) => a.quality === preferredQuality);

      // Fallback to lower quality if preferred not available
      if (!asset) {
        const qualityOrder = ['360p', '480p', '720p', '1080p', 'original'];
        const preferredIndex = qualityOrder.indexOf(preferredQuality);
        
        // Try lower qualities first
        for (let i = preferredIndex - 1; i >= 0; i--) {
          asset = videoDetails.assets.find((a: any) => a.quality === qualityOrder[i]);
          if (asset) {
            console.log(`⚠️ Качество ${preferredQuality} недоступно, используем ${asset.quality}`);
            break;
          }
        }
        
        // If no lower quality, try higher qualities
        if (!asset) {
          for (let i = preferredIndex + 1; i < qualityOrder.length; i++) {
            asset = videoDetails.assets.find((a: any) => a.quality === qualityOrder[i]);
            if (asset) {
              console.log(`⚠️ Качество ${preferredQuality} недоступно, используем ${asset.quality}`);
              break;
            }
          }
        }
      }

      if (!asset) {
        // Use first available asset as last resort
        asset = videoDetails.assets[0];
        console.log(`⚠️ Используем первый доступный ассет: ${asset.quality}`);
      }

      const downloadUrl = asset.download_link || asset.url;
      
      if (!downloadUrl) {
        throw new Error('У ассета нет URL для скачивания');
      }

      console.log(`✅ Найден URL (качество: ${asset.quality}, размер: ${(asset.file_size / 1024 / 1024).toFixed(1)} MB)`);
      return downloadUrl;
      
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Не удалось получить URL: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Retry request with exponential backoff for rate limiting
   * 
   * @param requestFn Function that makes the API request
   * @param maxRetries Maximum number of retry attempts
   * @returns Response from successful request
   */
  private async retryRequest<T>(
    requestFn: () => Promise<T>,
    maxRetries: number = 3
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error;

        if (axios.isAxiosError(error) && error.response?.status === 429) {
          const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
          console.log(`⏳ Rate limited. Retrying in ${delay / 1000}s... (attempt ${attempt + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        // Don't retry on other errors
        throw error;
      }
    }

    throw lastError;
  }

  /**
   * Validate API connection and credentials
   * 
   * @returns true if connection is valid
   */
  async validateConnection(): Promise<boolean> {
    try {
      await this.client.get('/projects');
      return true;
    } catch (error) {
      return false;
    }
  }
}

/**
 * Create a Kinescope service instance from environment variables
 */
export function createKinescopeService(): KinescopeService {
  const apiKey = process.env.KINESCOPE_API_KEY;
  
  if (!apiKey) {
    throw new Error('KINESCOPE_API_KEY environment variable is required');
  }

  return new KinescopeService({
    apiKey,
    baseUrl: process.env.KINESCOPE_API_URL || 'https://api.kinescope.io/v1',
  });
}
