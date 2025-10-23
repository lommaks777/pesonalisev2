#!/usr/bin/env tsx
import 'dotenv/config';
import axios from 'axios';

async function main() {
  const folderId = '65272142-15a1-47fa-903e-c779f101f149';
  const apiKey = process.env.KINESCOPE_API_KEY;
  
  if (!apiKey) {
    console.error('❌ KINESCOPE_API_KEY не найден');
    return;
  }

  const client = axios.create({
    baseURL: 'https://api.kinescope.io/v1',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    timeout: 10000,
  });

  try {
    console.log('🔍 Получение видео из папки...\n');
    
    const videosResp = await client.get('/videos', {
      params: {
        folder_id: folderId,
        per_page: 5
      }
    });
    
    const videos = videosResp.data.data || [];
    console.log(`Найдено видео: ${videos.length}\n`);
    
    if (videos.length > 0) {
      const firstVideo = videos[0];
      console.log(`📹 Первое видео: ${firstVideo.title}`);
      console.log(`   ID: ${firstVideo.id}\n`);
      
      // Получаем детали первого видео
      console.log('🔍 Получение деталей видео...\n');
      const detailsResp = await client.get(`/videos/${firstVideo.id}`);
      const details = detailsResp.data.data || detailsResp.data;
      
      console.log('📋 Детали видео:');
      console.log(JSON.stringify(details, null, 2));
    }

  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      console.error('❌ Ошибка:', error.code, error.message);
      if (error.response) {
        console.error('   Статус:', error.response.status);
        console.error('   Данные:', error.response.data);
      }
    } else {
      console.error('❌ Ошибка:', error.message);
    }
  }
}

main();
