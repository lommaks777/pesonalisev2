#!/usr/bin/env tsx
/**
 * Simplified Course Processing Script
 * 
 * Accepts a Kinescope folder URL and automatically processes all videos.
 * This is a wrapper around process-course-transcripts.ts that handles URL parsing.
 * 
 * Usage:
 *   npx tsx --env-file=.env.local scripts/process-course-from-url.ts \
 *     --url="https://app.kinescope.io/video?segment=..." \
 *     --course-slug=new-course \
 *     --course-title="New Course Title" \
 *     [--start-lesson=1] \
 *     [--end-lesson=12] \
 *     [--resume]
 */

import 'dotenv/config';
import { spawn } from 'child_process';

interface CourseProcessingOptions {
  url: string;
  courseSlug: string;
  courseTitle: string;
  courseDescription?: string;
  startLesson?: number;
  endLesson?: number;
  resume?: boolean;
  skipDownload?: boolean;
  skipTranscription?: boolean;
}

/**
 * Extract parent_id from Kinescope URL with segment parameter
 */
function extractFolderIdFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const segment = urlObj.searchParams.get('segment');
    
    if (!segment) {
      console.error('❌ Segment параметр не найден в URL');
      return null;
    }
    
    console.log(`🔍 Найден segment: ${segment}`);
    
    // Decode base64
    const decoded = Buffer.from(segment, 'base64').toString('utf-8');
    console.log(`📦 Декодированный segment: ${decoded}`);
    
    // Parse JSON
    const data = JSON.parse(decoded);
    
    if (data.parent_id) {
      console.log(`✅ Извлечен folder_id: ${data.parent_id}\n`);
      return data.parent_id;
    }
    
    console.error('❌ parent_id не найден в segment');
    return null;
  } catch (error: any) {
    console.error('❌ Ошибка при извлечении folder_id:', error.message);
    return null;
  }
}

/**
 * Execute the main processing script with extracted folder_id
 */
async function processCourseFromUrl(options: CourseProcessingOptions): Promise<void> {
  console.log('\n' + '='.repeat(70));
  console.log('🚀 ОБРАБОТКА КУРСА ПО URL');
  console.log('='.repeat(70));
  console.log(`URL: ${options.url}`);
  console.log(`Курс: ${options.courseTitle}`);
  console.log(`Слаг: ${options.courseSlug}`);
  console.log('='.repeat(70) + '\n');

  // Extract folder_id from URL
  const folderId = extractFolderIdFromUrl(options.url);
  
  if (!folderId) {
    throw new Error('Не удалось извлечь folder_id из URL');
  }

  // Build command arguments for the main processing script
  const scriptPath = new URL('./process-course-transcripts.ts', import.meta.url).pathname;
  const args = [
    '--env-file=.env.local',
    scriptPath,
    '--course-slug', options.courseSlug,
    '--course-title', options.courseTitle,
    '--kinescope-folder-id', folderId,
  ];

  if (options.courseDescription) {
    args.push('--course-description', options.courseDescription);
  }

  if (options.startLesson) {
    args.push('--start-lesson', options.startLesson.toString());
  }

  if (options.endLesson) {
    args.push('--end-lesson', options.endLesson.toString());
  }

  if (options.resume) {
    args.push('--resume');
  }

  if (options.skipDownload) {
    args.push('--skip-download');
  }

  if (options.skipTranscription) {
    args.push('--skip-transcription');
  }

  console.log('🔧 Запуск обработчика транскрипций...\n');
  console.log(`Команда: npx tsx ${args.join(' ')}\n`);
  console.log('='.repeat(70) + '\n');

  // Execute the main processing script
  return new Promise((resolve, reject) => {
    const child = spawn('npx', ['tsx', ...args], {
      stdio: 'inherit',
      shell: true,
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Процесс завершился с кодом ${code}`));
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Parse command-line arguments
 */
function parseCliArgs(args: string[]): CourseProcessingOptions {
  const options: Partial<CourseProcessingOptions> = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    // Handle --key=value format
    if (arg.includes('=')) {
      const eqIndex = arg.indexOf('=');
      const key = arg.substring(0, eqIndex);
      const value = arg.substring(eqIndex + 1);

      switch (key) {
        case '--url':
          options.url = value;
          break;
        case '--course-slug':
          options.courseSlug = value;
          break;
        case '--course-title':
          options.courseTitle = value;
          break;
        case '--course-description':
          options.courseDescription = value;
          break;
        case '--start-lesson':
          options.startLesson = parseInt(value, 10);
          break;
        case '--end-lesson':
          options.endLesson = parseInt(value, 10);
          break;
      }
    } else {
      // Handle --key value format
      switch (arg) {
        case '--url':
          options.url = args[++i];
          break;
        case '--course-slug':
          options.courseSlug = args[++i];
          break;
        case '--course-title':
          options.courseTitle = args[++i];
          break;
        case '--course-description':
          options.courseDescription = args[++i];
          break;
        case '--start-lesson':
          options.startLesson = parseInt(args[++i], 10);
          break;
        case '--end-lesson':
          options.endLesson = parseInt(args[++i], 10);
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
  }

  // Validate required options
  if (!options.url || !options.courseSlug || !options.courseTitle) {
    console.error('❌ Отсутствуют обязательные аргументы\n');
    console.error(`Получено: url=${options.url}, slug=${options.courseSlug}, title=${options.courseTitle}\n`);
    printHelp();
    process.exit(1);
  }

  return options as CourseProcessingOptions;
}

/**
 * Print usage help
 */
function printHelp(): void {
  console.log(`
Simplified Course Processing from Kinescope URL

Usage:
  npx tsx --env-file=.env.local scripts/process-course-from-url.ts [options]

Required Options:
  --url <url>                       Kinescope folder URL with segment parameter
                                    Example: https://app.kinescope.io/video?segment=...
  --course-slug <slug>              Course identifier (e.g., "taping-basics")
  --course-title <title>            Course title (e.g., "Основы тейпирования")

Optional:
  --course-description <desc>       Course description (default: auto-generated)
  --start-lesson <number>           Start from lesson N (default: 1)
  --end-lesson <number>             End at lesson N (default: all lessons)
  --resume                          Skip lessons that already have transcripts
  --skip-download                   Skip video download and audio extraction
  --skip-transcription              Skip transcription step
  -h, --help                        Show this help message

Examples:
  # Process all lessons from a Kinescope folder
  npx tsx --env-file=.env.local scripts/process-course-from-url.ts \\
    --url="https://app.kinescope.io/video?segment=eyJwYXJlbnRfaWQiOiI2NTI3MjE0Mi0xNWExLTQ3ZmEtOTAzZS1jNzc5ZjEwMWYxNDkifQ" \\
    --course-slug=taping-basics \\
    --course-title="Основы тейпирования"

  # Process with description and resume mode
  npx tsx --env-file=.env.local scripts/process-course-from-url.ts \\
    --url="https://app.kinescope.io/video?segment=..." \\
    --course-slug=taping-basics \\
    --course-title="Основы тейпирования" \\
    --course-description="Курс по основам кинезиотейпирования" \\
    --resume

  # Process only lessons 3-5
  npx tsx --env-file=.env.local scripts/process-course-from-url.ts \\
    --url="https://app.kinescope.io/video?segment=..." \\
    --course-slug=taping-basics \\
    --course-title="Основы тейпирования" \\
    --start-lesson=3 \\
    --end-lesson=5

Environment Variables Required:
  KINESCOPE_API_KEY               Kinescope API authentication key
  OPENAI_API_KEY                  OpenAI API key for Whisper
  NEXT_PUBLIC_SUPABASE_URL        Supabase project URL
  NEXT_PUBLIC_SUPABASE_ANON_KEY   Supabase anon key

Note:
  This script extracts the folder_id from the URL's segment parameter and
  passes it to the main processing pipeline (process-course-transcripts.ts).
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

  processCourseFromUrl(options)
    .then(() => {
      console.log('\n✅ Обработка курса завершена успешно!\n');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Критическая ошибка:', error.message);
      console.error(error.stack);
      process.exit(1);
    });
}
