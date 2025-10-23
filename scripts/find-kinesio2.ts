#!/usr/bin/env tsx
import 'dotenv/config';
import { createKinescopeService } from '@/lib/services/kinescope';

const projectIds = [
  { name: 'Материалы Клуба Мастеров Массажа', id: 'ee91b23c-1f06-484d-97de-52e5658b273a' },
  { name: 'Видео отзывы/кейсы учеников', id: '82b6b394-e07f-4ba7-9377-42422604b904' },
  { name: 'Онлайн обучение', id: '90c0856f-9470-4120-baa8-fceb5f758081' },
  { name: 'Очное обучение', id: 'bf1a4168-8711-4294-beb4-0841ba097b58' },
  { name: 'Рекламные ролики ШММ', id: 'b79be39d-badc-4848-ad66-e48cd915c93d' },
  { name: 'Обучение для сотрудников', id: '24755e80-3ac7-4954-81c7-920d8b2a60c8' },
  { name: 'Интервью', id: '76988174-4cde-4884-a725-a6e52a68a4e1' },
  { name: 'Отзывы учеников ШММ', id: '619a3919-9ff6-40c0-9c28-1588fb407d0c' },
  { name: 'Прямые эфиры', id: '67877e35-c37a-43a4-9a2a-14c1f40dec47' },
  { name: 'Пятиминутные видео для ТГ', id: '55d50433-0e85-421c-ae13-3506fa8e7237' },
];

async function main() {
  const kinescope = createKinescopeService();
  
  console.log('🔍 Поиск курса Кинезио 2 в проектах...\n');
  
  for (const project of projectIds) {
    console.log(`\n📂 Проверка проекта: ${project.name}`);
    console.log(`   ID: ${project.id}`);
    
    try {
      const videos = await kinescope.fetchProjectVideos(project.id, false);
      
      if (videos.length > 0) {
        console.log(`   ✅ Найдено видео: ${videos.length}\n`);
        
        // Показываем первые 5 видео для проверки
        videos.slice(0, 5).forEach((v, i) => {
          console.log(`   ${i + 1}. ${v.title}`);
        });
        
        if (videos.length > 5) {
          console.log(`   ... и еще ${videos.length - 5} видео`);
        }
        
        // Проверяем, есть ли в названиях "кинезио" или "kinesio"
        const kinesioVideos = videos.filter(v => 
          v.title.toLowerCase().includes('кинезио') || 
          v.title.toLowerCase().includes('kinesio')
        );
        
        if (kinesioVideos.length > 0) {
          console.log(`\n   🎯 НАЙДЕНЫ ВИДЕО С "КИНЕЗИО": ${kinesioVideos.length}`);
          kinesioVideos.forEach((v, i) => {
            console.log(`   ${i + 1}. ${v.title}`);
            console.log(`      ID: ${v.id}`);
          });
          
          console.log(`\n✨ ИСПОЛЬЗУЙТЕ ЭТОТ ПРОЕКТ ID: ${project.id}`);
          break;
        }
      } else {
        console.log(`   ⚪ Видео не найдено`);
      }
    } catch (error: any) {
      console.error(`   ❌ Ошибка: ${error.message}`);
    }
  }
}

main();
