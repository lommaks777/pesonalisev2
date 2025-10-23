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
    console.log('🔍 Получение списка проектов...\n');
    const projectsResp = await client.get('/projects');
    const projects = projectsResp.data.data || projectsResp.data;
    
    console.log(`Найдено проектов: ${projects.length}\n`);
    projects.forEach((p: any, i: number) => {
      console.log(`${i + 1}. ${p.name || p.title}`);
      console.log(`   ID: ${p.id}`);
      console.log(`   Видео: ${p.videos_count || 0}\n`);
    });

    // Попробуем получить видео из папки напрямую
    console.log('\n📁 Попытка получить видео из папки...\n');
    const folderId = '65272142-15a1-47fa-903e-c779f101f149';
    
    try {
      const folderResp = await client.get(`/folders/${folderId}/videos`);
      const videos = folderResp.data.data || folderResp.data.videos || [];
      console.log(`✅ Найдено видео в папке: ${videos.length}\n`);
      
      videos.forEach((v: any, i: number) => {
        console.log(`${i + 1}. ${v.title}`);
        console.log(`   ID: ${v.id}`);
        console.log(`   Статус: ${v.status}\n`);
      });
    } catch (error: any) {
      console.error(`❌ Ошибка получения видео из папки: ${error.response?.status} - ${error.response?.statusText}`);
      console.error(`   Сообщение: ${error.message}`);
      if (error.response?.data) {
        console.error(`   Данные:`, error.response.data);
      }
    }

  } catch (error: any) {
    console.error('❌ Ошибка:', error.response?.data || error.message);
  }
}

main();
