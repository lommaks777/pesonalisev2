#!/usr/bin/env tsx
import 'dotenv/config';
import axios from 'axios';

async function main() {
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
  });

  try {
    // Попробуем получить все видео
    console.log('🔍 Попытка получить все видео...\n');
    
    try {
      const videosResp = await client.get('/videos', {
        params: {
          per_page: 100,
        }
      });
      const allVideos = videosResp.data.data || videosResp.data.videos || [];
      
      console.log(`✅ Всего найдено видео: ${allVideos.length}\n`);
      
      // Фильтруем видео с "кинезио"
      const kinesioVideos = allVideos.filter((v: any) => 
        v.title && (
          v.title.toLowerCase().includes('кинезио') || 
          v.title.toLowerCase().includes('kinesio')
        )
      );
      
      if (kinesioVideos.length > 0) {
        console.log(`🎯 Найдено видео с "кинезио": ${kinesioVideos.length}\n`);
        kinesioVideos.forEach((v: any, i: number) => {
          console.log(`${i + 1}. ${v.title}`);
          console.log(`   ID: ${v.id}`);
          console.log(`   Проект ID: ${v.project_id || 'N/A'}`);
          console.log(`   Статус: ${v.status}\n`);
        });
      } else {
        console.log('⚠️  Видео с "кинезио" не найдено\n');
        console.log('Первые 10 видео:');
        allVideos.slice(0, 10).forEach((v: any, i: number) => {
          console.log(`${i + 1}. ${v.title}`);
        });
      }
    } catch (error: any) {
      console.error(`❌ Ошибка получения видео: ${error.response?.status} - ${error.response?.statusText}`);
      if (error.response?.data) {
        console.error(`   Данные:`, error.response.data);
      }
    }

  } catch (error: any) {
    console.error('❌ Ошибка:', error.response?.data || error.message);
  }
}

main();
