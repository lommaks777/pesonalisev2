#!/usr/bin/env tsx
/**
 * Generate Lesson Templates from Transcripts
 * 
 * Creates base lesson templates ("fish") from transcripts stored in database.
 * These templates are shown to users who haven't filled out the survey.
 * 
 * Usage:
 *   npx tsx --env-file=.env.local scripts/generate-course-templates.ts \
 *     --course-slug=taping-basics \
 *     [--start-lesson=1] \
 *     [--end-lesson=5]
 */

import 'dotenv/config';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import fs from 'fs';
import path from 'path';

interface GenerateOptions {
  courseSlug: string;
  startLesson?: number;
  endLesson?: number;
}

interface LessonTemplate {
  '👋 Введение': string;
  '🔑 Ключевые моменты': string[];
  '💡 Практические советы': string[];
  '⚠️ Важно'?: string[];
  '🧰 Инвентарь и подготовка'?: string;
  '📚 Домашнее задание': string;
  '_мотивационная строка_': string;
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate lesson template from transcript using OpenAI
 */
async function generateLessonTemplate(
  lessonNumber: number,
  lessonTitle: string,
  transcript: string
): Promise<LessonTemplate | null> {
  const prompt = `Ты методист и редактор транскриптов. 
Задача: из «сырой» транскрибации урока создать компактную карточку-резюме для студентов. 
Работай строго по фактам транскрипта, ничего не выдумывай.

ИНФОРМАЦИЯ ОБ УРОКЕ:
- Номер: ${lessonNumber}
- Название: ${lessonTitle}

ТРАНСКРИПТ УРОКА:
${transcript}

ТРЕБОВАНИЯ К ВЫХОДУ (чистый Markdown, без преамбул, без пояснений):
1) 👋 **Введение**  
   2–3 коротких предложения. 
   Укажи цель урока простыми словами и ожидаемый результат.

2) 🔑 **Ключевые моменты**  
   4–6 пунктов, каждый ≤ 18 слов. Форматируй как «что узнаете/научитесь/поймёте». 
   Сфокусируйся на техниках, зонах работы, критериях эффективности, адаптациях под клиента/аудиторию.

3) 💡 **Практические советы**  
   3–5 пунктов-инструкций, каждый начинается с глагола («Делайте…», «Избегайте…», «Следите…»). 
   Включи безопасность, коммуникацию с клиентом, контроль боли/давления, типичные ошибки и как их избежать.

4) ⚠️ **Важно** *(раздел добавляй только если это явно есть в транскрипте)*  
   2–4 пункта про противопоказания, ограничения, меру давления/времени, что «не делать».

5) 🧰 **Инвентарь и подготовка** *(добавляй, если встречается)*  
   Краткий список: стол/стул, масло/крем, полотенце, тайминг, положение модели.

6) 📚 **Домашнее задание**  
   1–2 предложения с конкретным, проверяемым действием (что сделать, сколько раз/времени, что записать/замерить).

7) _(мотивационная строка)_  
   1 предложение курсивом, вдохновляющее двигаться к результату, без маркетингового пафоса.

СТИЛЬ И ОГРАНИЧЕНИЯ:
- Ясно и дружелюбно (уровень чтения B1–B2).
- Термины поясняй по-простому.
- Убирай повторы, паразитные слова, оговорки.
- Числа и дозировки времени указывай только если есть в транскрипте.
- Не добавляй ссылки, источники и «лишние» эмодзи; используй эмодзи только в заголовках.
- Если данных для какого-то раздела нет — просто опусти его.

ЖЁСТКИЕ ЗАПРЕТЫ:
- Не используй общие фразы без факта из транскрипта.
- Не добавляй техники, зоны, эффекты, противопоказания, которых нет в транскрипте.
- Пиши только факты и формулировки, которые прямо следуют из транскрипта.

ФОРМАТ ОТВЕТА (JSON с emoji-ключами):
{
  "👋 Введение": "2-3 предложения: цель урока и ожидаемый результат",
  "🔑 Ключевые моменты": ["пункт 1 (≤18 слов)", "пункт 2", "пункт 3", "пункт 4"],
  "💡 Практические советы": ["совет 1 (с глагола)", "совет 2", "совет 3"],
  "⚠️ Важно": ["примечание 1", "примечание 2"],
  "🧰 Инвентарь и подготовка": "список оборудования и тайминг",
  "📚 Домашнее задание": "1-2 предложения с конкретным измеримым действием",
  "_мотивационная строка_": "1 вдохновляющее предложение без пафоса"
}

ВАЖНО:
- Используй ТОЧНО такие ключи с emoji, как в примере выше
- key_points и practical_tips ДОЛЖНЫ быть массивами строк
- Не включай поля "⚠️ Важно" и "🧰 Инвентарь" если их нет в транскрипте
- Каждый пункт в "🔑 Ключевые моменты" не более 18 слов
- Каждый совет в "💡 Практические советы" начинается с глагола

Отвечай ТОЛЬКО валидным JSON, без дополнительного текста.`;

  try {
    console.log(`   🤖 Генерация шаблона с помощью GPT-4o...`);
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'Ты - методист и редактор транскриптов образовательных курсов. Создаешь структурированные описания уроков на основе транскриптов. Работаешь строго по фактам, ничего не выдумываешь.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      console.error(`   ❌ Пустой ответ от OpenAI`);
      return null;
    }

    // Clean markdown code blocks
    let cleanResponse = response.trim();
    if (cleanResponse.startsWith('```json')) {
      cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    }
    if (cleanResponse.startsWith('```')) {
      cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    // Parse JSON
    try {
      const template = JSON.parse(cleanResponse) as LessonTemplate;
      console.log(`   ✅ Шаблон сгенерирован успешно`);
      return template;
    } catch (parseError) {
      console.error(`   ❌ Ошибка парсинга JSON:`, parseError);
      console.log('   Ответ от OpenAI:', cleanResponse.substring(0, 200) + '...');
      return null;
    }

  } catch (error: any) {
    console.error(`   ❌ Ошибка OpenAI:`, error.message);
    return null;
  }
}

/**
 * Main generation function
 */
async function generateCourseTemplates(options: GenerateOptions): Promise<void> {
  console.log('\n' + '='.repeat(70));
  console.log('📝 ГЕНЕРАЦИЯ ШАБЛОНОВ УРОКОВ');
  console.log('='.repeat(70));
  console.log(`Курс: ${options.courseSlug}`);
  if (options.startLesson || options.endLesson) {
    console.log(`Диапазон: ${options.startLesson || 1} - ${options.endLesson || 'конец'}`);
  }
  console.log('='.repeat(70) + '\n');

  // Initialize Supabase
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase credentials not found');
  }
  
  const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
    auth: { persistSession: false }
  });

  // Get course
  console.log('📚 Получение информации о курсе...\n');
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('id, title')
    .eq('slug', options.courseSlug)
    .single();

  if (courseError || !course) {
    throw new Error(`Курс не найден: ${options.courseSlug}`);
  }

  console.log(`✅ Курс: "${(course as any).title}" (${(course as any).id})\n`);

  // Get lessons with transcripts
  console.log('📖 Получение уроков с транскриптами...\n');
  
  let query = supabase
    .from('lessons')
    .select('*')
    .eq('course_id', (course as any).id)
    .not('content->transcription', 'is', null)
    .order('lesson_number', { ascending: true });

  if (options.startLesson) {
    query = query.gte('lesson_number', options.startLesson);
  }
  if (options.endLesson) {
    query = query.lte('lesson_number', options.endLesson);
  }

  const { data: lessons, error: lessonsError } = await query;

  if (lessonsError) {
    throw new Error(`Ошибка загрузки уроков: ${lessonsError.message}`);
  }

  if (!lessons || lessons.length === 0) {
    console.log('⚠️  Уроки с транскриптами не найдены\n');
    return;
  }

  console.log(`Найдено ${lessons.length} уроков с транскриптами\n`);
  console.log('='.repeat(70) + '\n');

  // Create output directory
  const outputDir = path.join(process.cwd(), 'store', options.courseSlug, 'templates');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`📁 Создана папка: ${outputDir}\n`);
  }

  // Process each lesson
  let successful = 0;
  let failed = 0;

  for (const lessonData of lessons) {
    const lesson = lessonData as any;
    console.log('━'.repeat(70));
    console.log(`📚 УРОК ${lesson.lesson_number}: ${lesson.title}`);
    console.log('━'.repeat(70) + '\n');

    try {
      const transcript = lesson.content?.transcription as string;
      
      if (!transcript) {
        console.log('   ⚠️  Транскрипт пуст, пропускаем\n');
        failed++;
        continue;
      }

      console.log(`   📄 Длина транскрипта: ${transcript.length} символов`);

      // Generate template
      const template = await generateLessonTemplate(
        lesson.lesson_number,
        lesson.title,
        transcript
      );

      if (!template) {
        console.log('   ❌ Не удалось сгенерировать шаблон\n');
        failed++;
        continue;
      }

      // Save template to file
      const templateFile = path.join(
        outputDir,
        `lesson-${lesson.lesson_number.toString().padStart(2, '0')}-template.json`
      );

      fs.writeFileSync(
        templateFile,
        JSON.stringify(template, null, 2),
        'utf8'
      );

      console.log(`   💾 Шаблон сохранен: ${path.relative(process.cwd(), templateFile)}`);

      // Update lesson in database with template
      const updatePayload: any = {
        content: {
          ...(lesson.content || {}),
          template: template
        }
      };
      
      // @ts-ignore - Supabase type inference issue
      const { error: updateError } = await supabase
        .from('lessons')
        .update(updatePayload)
        .eq('id', lesson.id);

      if (updateError) {
        console.log(`   ⚠️  Предупреждение: не удалось обновить БД: ${updateError.message}`);
      } else {
        console.log(`   ✅ Шаблон добавлен в базу данных`);
      }

      console.log('');
      successful++;

    } catch (error: any) {
      console.error(`   ❌ Ошибка обработки: ${error.message}\n`);
      failed++;
    }
  }

  // Print summary
  console.log('='.repeat(70));
  console.log('🎉 ГЕНЕРАЦИЯ ЗАВЕРШЕНА!');
  console.log('='.repeat(70));
  console.log(`Всего уроков: ${lessons.length}`);
  console.log(`✅ Успешно: ${successful}`);
  console.log(`❌ Ошибок: ${failed}`);
  console.log(`📁 Папка с шаблонами: ${path.relative(process.cwd(), outputDir)}`);
  console.log('='.repeat(70) + '\n');
}

/**
 * Parse CLI args
 */
function parseCliArgs(args: string[]): GenerateOptions {
  const options: Partial<GenerateOptions> = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg.includes('=')) {
      const [key, value] = arg.split('=');
      
      switch (key) {
        case '--course-slug':
          options.courseSlug = value;
          break;
        case '--start-lesson':
          options.startLesson = parseInt(value, 10);
          break;
        case '--end-lesson':
          options.endLesson = parseInt(value, 10);
          break;
      }
    } else {
      switch (arg) {
        case '--course-slug':
          options.courseSlug = args[++i];
          break;
        case '--start-lesson':
          options.startLesson = parseInt(args[++i], 10);
          break;
        case '--end-lesson':
          options.endLesson = parseInt(args[++i], 10);
          break;
        case '--help':
        case '-h':
          printHelp();
          process.exit(0);
      }
    }
  }

  if (!options.courseSlug) {
    console.error('❌ Отсутствует обязательный параметр: --course-slug\n');
    printHelp();
    process.exit(1);
  }

  return options as GenerateOptions;
}

/**
 * Print help
 */
function printHelp(): void {
  console.log(`
Generate Lesson Templates from Transcripts

Usage:
  npx tsx --env-file=.env.local scripts/generate-course-templates.ts [options]

Required:
  --course-slug <slug>    Course slug (e.g., "taping-basics")

Optional:
  --start-lesson <num>    Start from lesson N (default: 1)
  --end-lesson <num>      End at lesson N (default: all lessons)
  -h, --help              Show this help

Examples:
  # Generate templates for all lessons
  npx tsx --env-file=.env.local scripts/generate-course-templates.ts \\
    --course-slug=taping-basics

  # Generate for specific lesson range
  npx tsx --env-file=.env.local scripts/generate-course-templates.ts \\
    --course-slug=taping-basics \\
    --start-lesson=1 \\
    --end-lesson=3

Requirements:
  - OPENAI_API_KEY in .env.local
  - NEXT_PUBLIC_SUPABASE_URL in .env.local
  - NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local
  - Lessons must have transcripts in database
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

  generateCourseTemplates(options)
    .then(() => {
      console.log('✅ Скрипт завершен успешно\n');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Критическая ошибка:', error.message);
      console.error(error.stack);
      process.exit(1);
    });
}
