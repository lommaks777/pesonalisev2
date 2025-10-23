#!/usr/bin/env tsx
import 'dotenv/config';
import axios from 'axios';

/**
 * Извлекает parent_id из URL с segment параметром
 * URL формата: https://app.kinescope.io/video?segment=eyJwYXJlbnRfaWQiOiI2NTI3MjE0Mi0xNWExLTQ3ZmEtOTAzZS1jNzc5ZjEwMWYxNDkifQ
 */
function extractParentIdFromUrl(url: string): string | null {
  try {
    // Извлекаем segment параметр из URL
    const urlObj = new URL(url);
    const segment = urlObj.searchParams.get('segment');
    
    if (!segment) {
      console.log('⚠️ Segment параметр не найден в URL');
      return null;
    }
    
    console.log(`🔍 Найден segment: ${segment}`);
    
    // Декодируем base64
    const decoded = Buffer.from(segment, 'base64').toString('utf-8');
    console.log(`📦 Декодированный segment: ${decoded}`);
    
    // Парсим JSON
    const data = JSON.parse(decoded);
    
    if (data.parent_id) {
      console.log(`✅ Извлечен parent_id: ${data.parent_id}\n`);
      return data.parent_id;
    }
    
    console.log('⚠️ parent_id не найден в segment');
    return null;
  } catch (error) {
    console.error('❌ Ошибка при извлечении parent_id:', error);
    return null;
  }
}

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

  // URL с segment параметром
  const url = process.argv[2] || 'https://app.kinescope.io/video?segment=eyJwYXJlbnRfaWQiOiI2NTI3MjE0Mi0xNWExLTQ3ZmEtOTAzZS1jNzc5ZjEwMWYxNDkifQ';
  
  console.log(`🌐 URL: ${url}\n`);
  
  const folderId = extractParentIdFromUrl(url);
  
  if (!folderId) {
    console.error('❌ Не удалось извлечь folder_id из URL');
    return;
  }

  try {
    // Получаем список видео в папке, используя folder_id как query параметр
    console.log(`📂 Получение списка видео для folder_id: ${folderId}\n`);
    
    const response = await client.get('/videos', {
      params: {
        folder_id: folderId,
        per_page: 100,
        order: 'created_at.desc'
      }
    });
    
    const videos = response.data.data || [];
    
    console.log(`✅ Найдено видео: ${videos.length}\n`);
    
    // Выводим информацию о каждом видео
    videos.forEach((video: any, index: number) => {
      console.log(`\n📹 Видео ${index + 1}:`);
      console.log(`   ID: ${video.id}`);
      console.log(`   Название: ${video.title}`);
      console.log(`   Длительность: ${video.duration ? Math.round(video.duration / 60) : '?'} мин`);
      console.log(`   Создано: ${video.created_at}`);
      
      if (video.subtitles && video.subtitles.length > 0) {
        console.log(`   ✅ Субтитры: ${video.subtitles.length}`);
        video.subtitles.forEach((sub: any) => {
          console.log(`      - ${sub.label || sub.language}: ${sub.url}`);
        });
      }
    });
    
    // Сохраняем полный список в JSON
    const fs = await import('fs');
    const outputPath = './kinescope-videos-list.json';
    fs.writeFileSync(outputPath, JSON.stringify(videos, null, 2));
    console.log(`\n💾 Полный список сохранен в: ${outputPath}`);

  } catch (error: any) {
    console.error('❌ Ошибка:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('Детали:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

main();
