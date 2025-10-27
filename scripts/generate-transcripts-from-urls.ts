#!/usr/bin/env tsx
/**
 * Generate transcripts for lessons from Kinescope video URLs
 * Uses the courses_rules.md file to get video IDs
 */

import 'dotenv/config';
import { createKinescopeService } from '@/lib/services/kinescope';
import { downloadVideo, extractAudio } from '@/lib/services/video-processing';
import { transcribeAudioFile } from '@/lib/services/transcription';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import fs from 'fs';
import path from 'path';

interface LessonVideo {
  lessonNumber: number;
  videoId: string;
  courseSlug: string;
}

/**
 * Parse courses_rules.md to extract video URLs and IDs
 */
function parseCoursesRules(filePath: string): Map<string, LessonVideo[]> {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  const courseMap = new Map<string, LessonVideo[]>();
  let currentCourse = '';
  
  for (const line of lines) {
    const courseMatch = line.match(/^course=(.+)$/);
    if (courseMatch) {
      currentCourse = courseMatch[1];
      courseMap.set(currentCourse, []);
      continue;
    }
    
    const lessonMatch = line.match(/^lesson (\d+) - https:\/\/kinescope\.io\/([a-zA-Z0-9]+)$/);
    if (lessonMatch && currentCourse) {
      const lessons = courseMap.get(currentCourse)!;
      lessons.push({
        lessonNumber: parseInt(lessonMatch[1], 10),
        videoId: lessonMatch[2],
        courseSlug: currentCourse,
      });
    }
  }
  
  return courseMap;
}

/**
 * Process a single lesson video
 */
async function processLesson(
  lesson: LessonVideo,
  courseId: string,
  courseTitle: string,
  supabase: ReturnType<typeof createClient<Database>>,
  kinescope: ReturnType<typeof createKinescopeService>,
  skipExisting: boolean = true
): Promise<boolean> {
  console.log('\n' + '━'.repeat(70));
  console.log(`📚 УРОК ${lesson.lessonNumber}`);
  console.log(`   Курс: ${courseTitle}`);
  console.log(`   Video ID: ${lesson.videoId}`);
  console.log('━'.repeat(70) + '\n');

  try {
    // Check if transcript already exists
    if (skipExisting) {
      const { data: existingLesson } = await supabase
        .from('lessons')
        .select('content')
        .eq('course_id', courseId)
        .eq('lesson_number', lesson.lessonNumber)
        .maybeSingle() as any;

      if (existingLesson?.content?.transcription) {
        console.log('⏭️  Транскрипт уже существует, пропускаем...\n');
        return true;
      }
    }

    // Get video info from Kinescope
    console.log('📹 Получение информации о видео...\n');
    const videoInfo = await kinescope.getVideoDetails(lesson.videoId);
    
    if (!videoInfo) {
      throw new Error('Не удалось получить информацию о видео');
    }

    console.log(`   Название: ${videoInfo.title}`);
    console.log(`   Длительность: ${Math.floor(videoInfo.duration / 60)}м ${Math.floor(videoInfo.duration % 60)}с\n`);

    // Setup file paths
    const videoFileName = `${lesson.lessonNumber.toString().padStart(2, '0')}-${lesson.videoId}.mp4`;
    const audioFileName = `${lesson.lessonNumber.toString().padStart(2, '0')}-${lesson.videoId}.mp3`;
    
    const storeDir = path.join(process.cwd(), 'store', lesson.courseSlug);
    const videoPath = path.join(storeDir, 'videos', videoFileName);
    const audioPath = path.join(storeDir, 'audio', audioFileName);

    // Create directories
    fs.mkdirSync(path.dirname(videoPath), { recursive: true });
    fs.mkdirSync(path.dirname(audioPath), { recursive: true });

    // Step 1: Download video
    if (!fs.existsSync(videoPath)) {
      console.log('⬇️  Шаг 1/4: Загрузка видео (360p)...\n');
      
      const downloadUrl = await kinescope.getDownloadUrl(lesson.videoId, '360p');
      
      await downloadVideo({
        url: downloadUrl,
        outputPath: videoPath,
        onProgress: (downloaded, total) => {
          const percent = ((downloaded / total) * 100).toFixed(1);
          const downloadedMB = (downloaded / 1024 / 1024).toFixed(1);
          const totalMB = (total / 1024 / 1024).toFixed(1);
          process.stdout.write(`\r   Прогресс: ${percent}% (${downloadedMB}/${totalMB} МБ)`);
        },
      });
      
      console.log('\n✅ Видео загружено\n');
    } else {
      console.log('⏭️  Шаг 1/4: Видео уже существует\n');
    }

    // Step 2: Extract audio
    if (!fs.existsSync(audioPath)) {
      console.log('🎵 Шаг 2/4: Извлечение аудио...\n');
      
      await extractAudio({
        inputPath: videoPath,
        outputPath: audioPath,
        format: 'mp3',
        bitrate: '128k',
      });
      
      console.log('✅ Аудио извлечено\n');
    } else {
      console.log('⏭️  Шаг 2/4: Аудио уже существует\n');
    }

    // Step 3: Transcribe
    console.log('🎤 Шаг 3/4: Транскрибирование аудио...\n');
    
    const transcript = await transcribeAudioFile(
      audioPath,
      lesson.courseSlug,
      lesson.lessonNumber,
      'ru'
    );
    
    console.log(`✅ Транскрипт создан (${transcript.characterCount} символов)\n`);

    // Step 4: Store in database
    console.log('💾 Шаг 4/4: Сохранение в базу данных...\n');
    
    const { error: upsertError } = await (supabase
      .from('lessons')
      .upsert(
        {
          course_id: courseId,
          lesson_number: lesson.lessonNumber,
          title: videoInfo.title,
          summary: `Урок ${lesson.lessonNumber}: ${videoInfo.title}`,
          content: {
            transcription: transcript.text,
            transcription_length: transcript.characterCount,
            transcription_duration: transcript.duration,
            transcription_language: transcript.language,
            transcription_source: 'openai-whisper-1',
            transcription_date: new Date().toISOString(),
            video_id: lesson.videoId,
            video_duration: videoInfo.duration,
          },
        } as any,
        {
          onConflict: 'course_id,lesson_number',
        }
      ) as any);

    if (upsertError) {
      throw new Error(`Ошибка базы данных: ${upsertError.message}`);
    }

    console.log('✅ Сохранено в базу данных\n');

    // Step 5: Clean up temporary files
    console.log('🗑️  Очистка временных файлов...\n');
    
    try {
      if (fs.existsSync(videoPath)) {
        fs.unlinkSync(videoPath);
        console.log('   ✅ Удален файл видео');
      }
      if (fs.existsSync(audioPath)) {
        fs.unlinkSync(audioPath);
        console.log('   ✅ Удален файл аудио');
      }
    } catch (cleanupError: any) {
      console.warn(`   ⚠️  Предупреждение очистки: ${cleanupError.message}`);
    }
    
    console.log('\n✅ Обработка урока завершена!\n');
    return true;

  } catch (error: any) {
    console.error(`\n❌ Ошибка обработки урока ${lesson.lessonNumber}:`);
    console.error(`   ${error.message}\n`);
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  const coursesRulesPath = path.join(process.cwd(), 'courses_rules.md');
  
  console.log('\n' + '='.repeat(70));
  console.log('🚀 ГЕНЕРАЦИЯ ТРАНСКРИПТОВ ИЗ COURSES_RULES.MD');
  console.log('='.repeat(70) + '\n');

  // Parse courses_rules.md
  console.log('📖 Чтение courses_rules.md...\n');
  const courseMap = parseCoursesRules(coursesRulesPath);
  
  console.log(`Найдено курсов: ${courseMap.size}\n`);
  for (const [slug, lessons] of courseMap.entries()) {
    console.log(`   ${slug}: ${lessons.length} уроков`);
  }
  console.log();

  // Initialize services
  console.log('🔧 Инициализация сервисов...\n');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Учетные данные Supabase не найдены');
  }
  
  const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
    auth: { persistSession: false }
  });

  const kinescope = createKinescopeService();

  // Get command line arguments
  const args = process.argv.slice(2);
  const targetCourse = args.find(arg => !arg.startsWith('--'));
  const skipExisting = !args.includes('--force');

  // Process each course
  for (const [courseSlug, lessons] of courseMap.entries()) {
    // Skip if target course specified and this isn't it
    if (targetCourse && courseSlug !== targetCourse) {
      continue;
    }

    console.log('\n' + '═'.repeat(70));
    console.log(`📚 КУРС: ${courseSlug}`);
    console.log('═'.repeat(70) + '\n');

    // Get or create course in database
    const { data: existingCourse } = await (supabase
      .from('courses')
      .select('id, title')
      .eq('slug', courseSlug)
      .maybeSingle() as any);

    let courseId: string;
    let courseTitle: string;

    if (existingCourse) {
      courseId = existingCourse.id;
      courseTitle = existingCourse.title;
      console.log(`✅ Курс найден: "${courseTitle}" (${courseId})\n`);
    } else {
      const courseTitles: Record<string, string> = {
        'massazh-shvz': 'Массаж ШВЗ',
        'taping-basics': 'Основы тейпирования',
      };

      courseTitle = courseTitles[courseSlug] || courseSlug;

      const { data: newCourse, error } = await (supabase
        .from('courses')
        .insert({
          slug: courseSlug,
          title: courseTitle,
          description: `Course ${courseTitle}`,
        } as any)
        .select('id')
        .single() as any);

      if (error || !newCourse) {
        throw new Error(`Не удалось создать курс: ${error?.message}`);
      }

      courseId = newCourse.id;
      console.log(`✅ Курс создан: "${courseTitle}" (${courseId})\n`);
    }

    // Process lessons
    const stats = {
      total: lessons.length,
      successful: 0,
      failed: 0,
      skipped: 0,
    };

    for (const lesson of lessons) {
      const success = await processLesson(
        lesson,
        courseId,
        courseTitle,
        supabase,
        kinescope,
        skipExisting
      );

      if (success) {
        const { data: checkLesson } = await (supabase
          .from('lessons')
          .select('content')
          .eq('course_id', courseId)
          .eq('lesson_number', lesson.lessonNumber)
          .maybeSingle() as any);

        if (checkLesson?.content?.transcription) {
          stats.successful++;
        } else {
          stats.skipped++;
        }
      } else {
        stats.failed++;
      }
    }

    // Print course summary
    console.log('\n' + '═'.repeat(70));
    console.log(`📊 ИТОГИ ДЛЯ КУРСА: ${courseSlug}`);
    console.log('═'.repeat(70));
    console.log(`Всего уроков: ${stats.total}`);
    console.log(`✅ Успешно: ${stats.successful}`);
    console.log(`⏭️  Пропущено: ${stats.skipped}`);
    console.log(`❌ Ошибок: ${stats.failed}`);
    console.log('═'.repeat(70) + '\n');
  }

  console.log('\n✅ Генерация транскриптов завершена!\n');
}

// Run main
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('\n💥 Критическая ошибка:', error.message);
      console.error(error.stack);
      process.exit(1);
    });
}
