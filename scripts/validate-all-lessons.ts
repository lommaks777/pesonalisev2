/**
 * Скрипт для проверки соответствия номеров папок и уроков
 * Также проверяет наличие шаблонов
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs/promises';
import * as path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Переменные окружения не настроены!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

interface LessonFile {
  number: number;
  title: string;
  description?: any;
}

async function validateLessons() {
  console.log('🔍 Проверка уроков курса "Массаж ШВЗ"...\n');
  
  // 1. Проверка файловой системы
  console.log('📁 Проверка файловой системы:');
  console.log('─'.repeat(80));
  
  const lessonsDir = path.join(process.cwd(), 'store', 'shvz', 'lessons');
  const folders = await fs.readdir(lessonsDir);
  const sortedFolders = folders.filter(f => /^\d+$/.test(f)).sort();
  
  const fileSystemIssues: string[] = [];
  const lessonData: Array<{ folder: string; lesson: LessonFile }> = [];
  
  for (const folder of sortedFolders) {
    const lessonJsonPath = path.join(lessonsDir, folder, 'lesson.json');
    const content = await fs.readFile(lessonJsonPath, 'utf-8');
    const lesson: LessonFile = JSON.parse(content);
    
    lessonData.push({ folder, lesson });
    
    const folderNum = parseInt(folder);
    const lessonNum = lesson.number;
    const hasTemplate = lesson.description && typeof lesson.description === 'object' && lesson.description.template;
    
    const match = folderNum === lessonNum;
    const icon = match ? '✅' : '❌';
    const templateIcon = hasTemplate ? '📄' : '⚠️';
    
    console.log(`${icon} ${templateIcon} Папка ${folder} → Урок №${lessonNum}: ${lesson.title.substring(0, 50)}...`);
    
    if (!match) {
      fileSystemIssues.push(`Папка ${folder} содержит урок №${lessonNum} (не совпадают!)`);
    }
    
    if (!hasTemplate) {
      fileSystemIssues.push(`Урок ${lessonNum} в папке ${folder} не имеет шаблона`);
    }
  }
  
  console.log('');
  
  if (fileSystemIssues.length > 0) {
    console.log('⚠️ Найдены проблемы в файловой системе:');
    fileSystemIssues.forEach(issue => console.log(`  - ${issue}`));
    console.log('');
  } else {
    console.log('✅ Файловая система в порядке!\n');
  }
  
  // 2. Проверка базы данных
  console.log('💾 Проверка базы данных:');
  console.log('─'.repeat(80));
  
  const { data: course } = await supabase
    .from('courses')
    .select('id, slug, title')
    .eq('slug', 'massazh-shvz')
    .single();
  
  if (!course) {
    console.log('❌ Курс massazh-shvz не найден в БД!');
    return;
  }
  
  console.log(`📚 Курс: ${course.title} (${course.slug})`);
  console.log('');
  
  const { data: dbLessons } = await supabase
    .from('lessons')
    .select('id, lesson_number, title, content')
    .eq('course_id', course.id)
    .order('lesson_number');
  
  const dbIssues: string[] = [];
  
  if (!dbLessons || dbLessons.length === 0) {
    console.log('⚠️ Уроки в БД отсутствуют!');
    console.log('Запустите: npx tsx --env-file=.env.local scripts/import-lessons.ts');
    console.log('');
  } else {
    console.log(`Найдено уроков в БД: ${dbLessons.length}\n`);
    
    for (const dbLesson of dbLessons) {
      const hasTemplate = dbLesson.content?.template;
      const templateIcon = hasTemplate ? '📄' : '⚠️';
      
      // Найти соответствующий урок в файловой системе
      const fsLesson = lessonData.find(l => l.lesson.number === dbLesson.lesson_number);
      const matchIcon = fsLesson ? '✅' : '❌';
      
      console.log(`${matchIcon} ${templateIcon} БД Урок №${dbLesson.lesson_number}: ${dbLesson.title.substring(0, 50)}...`);
      
      if (!hasTemplate) {
        dbIssues.push(`Урок ${dbLesson.lesson_number} в БД не имеет шаблона`);
      }
      
      if (!fsLesson) {
        dbIssues.push(`Урок ${dbLesson.lesson_number} есть в БД, но отсутствует в файловой системе`);
      } else if (fsLesson.lesson.title !== dbLesson.title) {
        console.log(`  ⚠️ Названия различаются:`);
        console.log(`     ФС: ${fsLesson.lesson.title}`);
        console.log(`     БД: ${dbLesson.title}`);
      }
      
      // Проверить содержимое шаблона
      if (hasTemplate) {
        const template = dbLesson.content.template;
        const intro = template['👋 Введение'] || template.introduction;
        if (intro && intro.toLowerCase().includes('тейп')) {
          console.log(`  ⚠️⚠️⚠️ ВНИМАНИЕ: В шаблоне найдено слово "тейп"!`);
          dbIssues.push(`Урок ${dbLesson.lesson_number}: шаблон содержит слово "тейп" (возможно, неправильный контент)`);
        }
      }
    }
    console.log('');
    
    // Найти уроки из ФС, которых нет в БД
    for (const { folder, lesson } of lessonData) {
      const inDb = dbLessons.find(l => l.lesson_number === lesson.number);
      if (!inDb) {
        dbIssues.push(`Урок ${lesson.number} из папки ${folder} отсутствует в БД`);
      }
    }
  }
  
  if (dbIssues.length > 0) {
    console.log('⚠️ Найдены проблемы в базе данных:');
    dbIssues.forEach(issue => console.log(`  - ${issue}`));
    console.log('');
  } else {
    console.log('✅ База данных в порядке!\n');
  }
  
  // 3. Итоговый отчет
  console.log('═'.repeat(80));
  console.log('📊 ИТОГОВЫЙ ОТЧЕТ:');
  console.log('═'.repeat(80));
  
  const totalIssues = fileSystemIssues.length + dbIssues.length;
  
  if (totalIssues === 0) {
    console.log('✅ Все уроки в порядке!');
    console.log('✅ Номера папок соответствуют номерам уроков');
    console.log('✅ Все уроки имеют шаблоны');
    console.log('✅ База данных синхронизирована с файловой системой');
  } else {
    console.log(`❌ Найдено проблем: ${totalIssues}`);
    console.log('');
    
    if (fileSystemIssues.length > 0) {
      console.log('📁 Проблемы файловой системы:');
      fileSystemIssues.forEach(issue => console.log(`  - ${issue}`));
      console.log('');
    }
    
    if (dbIssues.length > 0) {
      console.log('💾 Проблемы базы данных:');
      dbIssues.forEach(issue => console.log(`  - ${issue}`));
      console.log('');
    }
    
    console.log('💡 Рекомендации:');
    if (fileSystemIssues.some(i => i.includes('не совпадают'))) {
      console.log('  1. Запустите: scripts/fix-lesson-folders.sh');
    }
    if (dbIssues.some(i => i.includes('отсутствует в БД')) || fileSystemIssues.some(i => i.includes('не имеет шаблона'))) {
      console.log('  2. Запустите: npx tsx --env-file=.env.local scripts/import-lessons.ts');
    }
    if (dbIssues.some(i => i.includes('тейп'))) {
      console.log('  3. Исправьте шаблоны, содержащие неправильный контент');
    }
  }
  
  console.log('');
}

validateLessons().catch(console.error);
