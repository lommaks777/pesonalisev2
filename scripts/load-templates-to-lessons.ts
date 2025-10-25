/**
 * Скрипт для загрузки шаблонов из *-final.json файлов в lesson.json
 */

import * as fs from 'fs/promises';
import * as path from 'path';

async function loadTemplates() {
  console.log('📦 Загрузка шаблонов в lesson.json файлы...\n');
  
  const shvzDir = path.join(process.cwd(), 'store', 'shvz');
  const lessonsDir = path.join(shvzDir, 'lessons');
  
  // Найти все *-final.json файлы
  const files = await fs.readdir(shvzDir);
  const templateFiles = files.filter(f => f.match(/^\d+-.*-final\.json$/));
  
  console.log(`Найдено файлов шаблонов: ${templateFiles.length}\n`);
  
  // Сопоставить файлы шаблонов с номерами уроков
  const templatesByLesson = new Map<number, any>();
  
  for (const file of templateFiles) {
    const match = file.match(/^(\d+)-/);
    if (match) {
      const lessonNum = parseInt(match[1]);
      const filePath = path.join(shvzDir, file);
      const content = await fs.readFile(filePath, 'utf-8');
      const template = JSON.parse(content);
      
      templatesByLesson.set(lessonNum, template);
      console.log(`  ${lessonNum}. ${file}`);
    }
  }
  
  console.log('');
  
  // Обновить lesson.json файлы
  const folders = await fs.readdir(lessonsDir);
  const sortedFolders = folders.filter(f => /^\d+$/.test(f)).sort();
  
  let updated = 0;
  let skipped = 0;
  
  for (const folder of sortedFolders) {
    const lessonJsonPath = path.join(lessonsDir, folder, 'lesson.json');
    const content = await fs.readFile(lessonJsonPath, 'utf-8');
    const lesson = JSON.parse(content);
    
    const lessonNum = lesson.number;
    const template = templatesByLesson.get(lessonNum);
    
    if (template) {
      // Обновить lesson.json
      lesson.description = { template };
      lesson.files = lesson.files || [];
      
      await fs.writeFile(lessonJsonPath, JSON.stringify(lesson, null, 4), 'utf-8');
      
      console.log(`✅ Урок ${lessonNum} (папка ${folder}): шаблон загружен`);
      updated++;
    } else {
      console.log(`⚠️ Урок ${lessonNum} (папка ${folder}): шаблон не найден`);
      skipped++;
    }
  }
  
  console.log('');
  console.log('═'.repeat(60));
  console.log(`✅ Обновлено уроков: ${updated}`);
  console.log(`⚠️ Пропущено уроков: ${skipped}`);
  console.log('═'.repeat(60));
  console.log('');
  
  if (updated > 0) {
    console.log('💡 Теперь запустите:');
    console.log('   npx tsx --env-file=.env.local scripts/import-lessons.ts');
    console.log('');
    console.log('   Это обновит базу данных с новыми шаблонами.');
  }
}

loadTemplates().catch(console.error);
