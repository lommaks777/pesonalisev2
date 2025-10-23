#!/usr/bin/env tsx
/**
 * Course Transcript Processing Pipeline
 * 
 * Orchestrates the full workflow for generating course transcripts:
 * 1. Fetch videos from Kinescope project
 * 2. Download videos (360p quality)
 * 3. Extract audio using FFmpeg
 * 4. Transcribe audio using OpenAI Whisper
 * 5. Store transcripts in database
 * 
 * Usage:
 *   npx tsx --env-file=.env.local scripts/process-course-transcripts.ts \
 *     --course-slug=new-course \
 *     --course-title="New Course Title" \
 *     --kinescope-project-id=abc123 \
 *     [--start-lesson=1] \
 *     [--end-lesson=12] \
 *     [--resume]
 */

import 'dotenv/config';
import { createKinescopeService } from '@/lib/services/kinescope';
import { downloadVideo, extractAudio, verifyFFmpeg, getFFmpegVersion } from '@/lib/services/video-processing';
import { transcribeAudioFile } from '@/lib/services/transcription';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import fs from 'fs';
import path from 'path';

interface ProcessingOptions {
  courseSlug: string;
  courseTitle: string;
  kinescopeProjectId?: string;
  kinescopeFolderId?: string;
  courseDescription?: string;
  startLesson?: number;
  endLesson?: number;
  resume?: boolean;
  skipDownload?: boolean;
  skipTranscription?: boolean;
}

interface ProcessingStats {
  total: number;
  successful: number;
  failed: number;
  skipped: number;
  errors: Array<{ lesson: number; error: string; step: string }>;
}

/**
 * Validate environment configuration
 */
async function validateEnvironment(): Promise<void> {
  console.log('🔍 Проверка окружения...\n');

  // Check API keys
  if (!process.env.KINESCOPE_API_KEY) {
    throw new Error('❌ KINESCOPE_API_KEY не найден в окружении');
  }
  console.log('✅ API ключ Kinescope найден');

  if (!process.env.OPENAI_API_KEY) {
    throw new Error('❌ OPENAI_API_KEY не найден в окружении');
  }
  console.log('✅ API ключ OpenAI найден');

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error('❌ NEXT_PUBLIC_SUPABASE_URL не найден в окружении');
  }
  console.log('✅ URL Supabase настроен');

  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY не найден в окружении');
  }
  console.log('✅ Ключ Supabase настроен');

  // Check FFmpeg
  const ffmpegAvailable = await verifyFFmpeg();
  if (!ffmpegAvailable) {
    throw new Error('❌ FFmpeg не найден. Установите FFmpeg: brew install ffmpeg');
  }
  
  const ffmpegVersion = await getFFmpegVersion();
  console.log(`✅ FFmpeg установлен (версия: ${ffmpegVersion})`);

  console.log('\n✅ Все проверки окружения пройдены\n');
}

/**
 * Main processing function
 */
async function processCourseTranscripts(options: ProcessingOptions): Promise<void> {
  const startTime = Date.now();

  console.log('\n' + '='.repeat(70));
  console.log('🚀 КОНВЕЙЕР ОБРАБОТКИ ТРАНСКРИПЦИЙ КУРСА');
  console.log('='.repeat(70));
  console.log(`Курс: ${options.courseTitle}`);
  console.log(`Слаг: ${options.courseSlug}`);
  if (options.kinescopeFolderId) {
    console.log(`Kinescope Folder ID: ${options.kinescopeFolderId}`);
  } else if (options.kinescopeProjectId) {
    console.log(`Kinescope Project ID: ${options.kinescopeProjectId}`);
  }
  if (options.startLesson || options.endLesson) {
    console.log(`Диапазон уроков: ${options.startLesson || 1} - ${options.endLesson || 'конец'}`);
  }
  if (options.resume) {
    console.log('Режим: ПРОДОЛЖЕНИЕ (пропуск существующих транскрипций)');
  }
  console.log('='.repeat(70) + '\n');

  // Validate environment
  await validateEnvironment();

  // Initialize services
  console.log('🔧 Инициализация сервисов...\n');
  const kinescope = createKinescopeService();
  
  // Create Supabase client for scripts
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Учетные данные Supabase не найдены');
  }
  
  const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
    auth: { persistSession: false }
  });

  // Create or fetch course in database
  console.log('📚 Настройка курса в базе данных...\n');
  let courseId: string;
  
  const { data: existingCourse } = await supabase
    .from('courses')
    .select('id, title')
    .eq('slug', options.courseSlug)
    .maybeSingle();

  if (existingCourse) {
    courseId = existingCourse.id;
    console.log(`✅ Курс найден: "${existingCourse.title}" (${courseId})\n`);
  } else {
    const { data: newCourse, error } = await supabase
      .from('courses')
      .insert({
        slug: options.courseSlug,
        title: options.courseTitle,
        description: options.courseDescription || `Course created from Kinescope project ${options.kinescopeProjectId}`,
      })
      .select('id')
      .single();

    if (error || !newCourse) {
      throw new Error(`Не удалось создать курс: ${error?.message}`);
    }

    courseId = newCourse.id;
    console.log(`✅ Курс создан: ${courseId}\n`);
  }

  // Fetch videos from Kinescope
  console.log('📹 Получение видео из Kinescope...\n');
  const videos = await kinescope.fetchProjectVideos(
    options.kinescopeProjectId,
    options.kinescopeFolderId
  );
  
  if (videos.length === 0) {
    console.log('⚠️  Видео в проекте не найдены\n');
    return;
  }

  console.log(`Найдено ${videos.length} видео\n`);

  // Filter videos by lesson range if specified
  const filteredVideos = videos.filter((_, index) => {
    const lessonNum = index + 1;
    if (options.startLesson && lessonNum < options.startLesson) return false;
    if (options.endLesson && lessonNum > options.endLesson) return false;
    return true;
  });

  console.log(`Обработка ${filteredVideos.length} уроков\n`);
  console.log('='.repeat(70) + '\n');

  // Processing statistics
  const stats: ProcessingStats = {
    total: filteredVideos.length,
    successful: 0,
    failed: 0,
    skipped: 0,
    errors: [],
  };

  // Process each video
  for (let i = 0; i < filteredVideos.length; i++) {
    const video = filteredVideos[i];
    const lessonNumber = (options.startLesson || 1) + i;

    console.log('\n' + '━'.repeat(70));
    console.log(`📚 УРОК ${lessonNumber}/${filteredVideos.length + (options.startLesson || 1) - 1}`);
    console.log(`   Название: ${video.title}`);
    console.log(`   ID видео: ${video.id}`);
    console.log(`   Длительность: ${Math.floor(video.duration / 60)}м ${Math.floor(video.duration % 60)}с`);
    console.log('━'.repeat(70) + '\n');

    try {
      // Check if lesson already has transcript (resume mode)
      if (options.resume) {
        const { data: existingLesson } = await supabase
          .from('lessons')
          .select('content')
          .eq('course_id', courseId)
          .eq('lesson_number', lessonNumber)
          .maybeSingle();

        if (existingLesson?.content?.transcription) {
          console.log('⏭️  Транскрипция уже существует, пропускаем...\n');
          stats.skipped++;
          continue;
        }
      }

      // Setup file paths
      const videoFileName = `${lessonNumber.toString().padStart(2, '0')}-${video.id}.mp4`;
      const audioFileName = `${lessonNumber.toString().padStart(2, '0')}-${video.id}.mp3`;
      
      const videoPath = path.join(process.cwd(), 'store', options.courseSlug, 'videos', videoFileName);
      const audioPath = path.join(process.cwd(), 'store', options.courseSlug, 'audio', audioFileName);

      // Step 1: Download video
      if (!options.skipDownload) {
        if (!fs.existsSync(videoPath)) {
          console.log('⬇️  Шаг 1/4: Загрузка видео (360p)...\n');
          
          const downloadUrl = await kinescope.getDownloadUrl(video.id, '360p');
          
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
          console.log('⏭️  Шаг 1/4: Видео уже существует, пропускаем загрузку\n');
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
          console.log('⏭️  Шаг 2/4: Аудио уже существует, пропускаем извлечение\n');
        }
      } else {
        console.log('⏭️  Шаги 1-2: Пропускаем загрузку и извлечение (флаг --skip-download)\n');
      }

      // Step 3: Transcribe
      if (!options.skipTranscription) {
        console.log('🎤 Шаг 3/4: Транскрибирование аудио...\n');
        
        const transcript = await transcribeAudioFile(
          audioPath,
          options.courseSlug,
          lessonNumber,
          'ru' // Russian language hint
        );
        
        // Step 4: Store in database
        console.log('💾 Шаг 4/4: Сохранение в базу данных...\n');
        
        const { error: upsertError } = await supabase
          .from('lessons')
          .upsert(
            {
              course_id: courseId,
              lesson_number: lessonNumber,
              title: video.title,
              summary: `Урок ${lessonNumber}: ${video.title}`,
              content: {
                transcription: transcript.text,
                transcription_length: transcript.characterCount,
                transcription_duration: transcript.duration,
                transcription_language: transcript.language,
                transcription_source: 'openai-whisper-1',
                transcription_date: new Date().toISOString(),
                video_id: video.id,
                video_duration: video.duration,
              },
            },
            {
              onConflict: 'course_id,lesson_number',
            }
          );

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
        stats.successful++;
      } else {
        console.log('⏭️  Шаги 3-4: Пропускаем транскрибирование (флаг --skip-transcription)\n');
        stats.skipped++;
      }
    } catch (error: any) {
      console.error(`\n❌ Ошибка обработки урока ${lessonNumber}:`);
      console.error(`   ${error.message}\n`);
      
      stats.failed++;
      stats.errors.push({
        lesson: lessonNumber,
        error: error.message,
        step: error.stack?.includes('transcribe') ? 'transcription' : 
              error.stack?.includes('download') ? 'download' :
              error.stack?.includes('extract') ? 'audio_extraction' : 'unknown',
      });
    }
  }

  // Print summary
  const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);

  console.log('\n' + '='.repeat(70));
  console.log('🎉 ОБРАБОТКА ЗАВЕРШЕНА!');
  console.log('='.repeat(70));
  console.log(`Всего уроков: ${stats.total}`);
  console.log(`✅ Успешно: ${stats.successful}`);
  console.log(`⏭️  Пропущено: ${stats.skipped}`);
  console.log(`❌ Ошибок: ${stats.failed}`);
  console.log(`⏱️  Времени затрачено: ${elapsed} минут`);
  console.log('='.repeat(70));

  if (stats.errors.length > 0) {
    console.log('\n❌ ОШИБКИ:\n');
    stats.errors.forEach(err => {
      console.log(`   Урок ${err.lesson} (${err.step}):`);
      console.log(`   ${err.error}\n`);
    });
  }

  // Save processing report
  const reportDir = path.join(process.cwd(), 'store', options.courseSlug, 'logs');
  const reportPath = path.join(reportDir, `processing_${Date.now()}.json`);
  
  try {
    fs.mkdirSync(reportDir, { recursive: true });
    fs.writeFileSync(
      reportPath,
      JSON.stringify(
        {
          timestamp: new Date().toISOString(),
          options,
          stats,
          elapsed_minutes: parseFloat(elapsed),
        },
        null,
        2
      )
    );
    console.log(`\n📄 Отчет сохранен: ${reportPath}\n`);
  } catch (reportError: any) {
    console.warn(`⚠️  Не удалось сохранить отчет: ${reportError.message}\n`);
  }
}

/**
 * Parse command-line arguments
 */
function parseCliArgs(args: string[]): ProcessingOptions {
  const options: Partial<ProcessingOptions> = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    switch (arg) {
      case '--course-slug':
        options.courseSlug = nextArg;
        i++;
        break;
      case '--course-title':
        options.courseTitle = nextArg;
        i++;
        break;
      case '--course-description':
        options.courseDescription = nextArg;
        i++;
        break;
      case '--kinescope-project-id':
        options.kinescopeProjectId = nextArg;
        i++;
        break;
      case '--kinescope-folder-id':
      case '--folder-id':
        options.kinescopeFolderId = nextArg;
        i++;
        break;
      case '--start-lesson':
        options.startLesson = parseInt(nextArg, 10);
        i++;
        break;
      case '--end-lesson':
        options.endLesson = parseInt(nextArg, 10);
        i++;
        break;
      case '--resume':
        options.resume = true;
        break;
      case '--skip-download':
        options.skipDownload = true;
        break;
      case '--skip-transcription':
        options.skipTranscription = true;
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
    }
  }

  // Validate required options
  if (!options.courseSlug || !options.courseTitle) {
    console.error('❌ Отсутствуют обязательные аргументы\n');
    printHelp();
    process.exit(1);
  }
  
  if (!options.kinescopeProjectId && !options.kinescopeFolderId) {
    console.error('❌ Необходимо указать --kinescope-project-id или --kinescope-folder-id\n');
    printHelp();
    process.exit(1);
  }

  return options as ProcessingOptions;
}

/**
 * Print usage help
 */
function printHelp(): void {
  console.log(`
Course Transcript Processing Pipeline

Usage:
  npx tsx --env-file=.env.local scripts/process-course-transcripts.ts [options]

Required Options:
  --course-slug <slug>              Course identifier (e.g., "back-massage")
  --course-title <title>            Course title (e.g., "Массаж спины")
  --kinescope-project-id <id>       Kinescope project ID (required if no folder-id)
  --kinescope-folder-id <id>        Kinescope folder ID (required if no project-id)

Optional:
  --course-description <desc>       Course description (default: auto-generated)
  --start-lesson <number>           Start from lesson N (default: 1)
  --end-lesson <number>             End at lesson N (default: all lessons)
  --resume                          Skip lessons that already have transcripts
  --skip-download                   Skip video download and audio extraction
  --skip-transcription              Skip transcription step
  -h, --help                        Show this help message

Examples:
  # Process all lessons in a project
  npx tsx --env-file=.env.local scripts/process-course-transcripts.ts \\
    --course-slug=back-massage \\
    --course-title="Массаж спины" \\
    --kinescope-project-id=abc123

  # Process lessons 5-10 only
  npx tsx --env-file=.env.local scripts/process-course-transcripts.ts \\
    --course-slug=back-massage \\
    --course-title="Массаж спины" \\
    --kinescope-project-id=abc123 \\
    --start-lesson=5 \\
    --end-lesson=10

  # Resume interrupted processing
  npx tsx --env-file=.env.local scripts/process-course-transcripts.ts \\
    --course-slug=back-massage \\
    --course-title="Массаж спины" \\
    --kinescope-project-id=abc123 \\
    --resume

Environment Variables Required:
  KINESCOPE_API_KEY               Kinescope API authentication key
  OPENAI_API_KEY                  OpenAI API key for Whisper
  NEXT_PUBLIC_SUPABASE_URL        Supabase project URL
  NEXT_PUBLIC_SUPABASE_ANON_KEY   Supabase anon key
`);
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printHelp();
    process.exit(0);
  }

  const options = parseCliArgs(args);

  processCourseTranscripts(options)
    .then(() => {
      console.log('✅ Конвейер завершен успешно\n');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Критическая ошибка:', error.message);
      console.error(error.stack);
      process.exit(1);
    });
}
