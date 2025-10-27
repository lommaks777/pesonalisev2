#!/usr/bin/env tsx
/**
 * Generate Default Lesson Descriptions
 * 
 * Creates default descriptions for each lesson using GPT-4o based on transcripts.
 * These descriptions are shown to users when personalization is not available.
 * 
 * Usage:
 *   pnpm course:generate-defaults [course-slug]
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import { getOpenAIClient } from '@/lib/services/openai';

interface DefaultDescription {
  introduction: string;
  what_you_will_learn: string;
  practical_benefits: string;
  key_techniques: string;
  equipment_needed?: string;
  homework: string;
  motivational_note: string;
}

/**
 * Generate default description using GPT-4o
 */
async function generateDefaultDescription(
  lessonNumber: number,
  lessonTitle: string,
  transcript: string,
  courseTitle: string
): Promise<DefaultDescription> {
  const openai = getOpenAIClient();

  const prompt = `You are an expert educational content creator. Based on the lesson transcript below, create a clear, engaging default lesson description that will be shown to all users (not personalized).

LESSON INFORMATION:
Course: ${courseTitle}
Lesson ${lessonNumber}: ${lessonTitle}
Transcript length: ${transcript.length} characters

TRANSCRIPT:
${transcript}

INSTRUCTIONS:
Create a structured lesson description with the following sections. Use ONLY information from the transcript. Be factual, clear, and professional.

Return your response as valid JSON with this exact structure:
{
  "introduction": "2-3 sentences introducing the lesson topic and its importance",
  "what_you_will_learn": "3-4 bullet points of specific knowledge/skills covered (each 1-2 sentences)",
  "practical_benefits": "2-3 sentences explaining how this knowledge helps in practice",
  "key_techniques": "3-4 bullet points of main techniques/methods taught (each 1-2 sentences)",
  "equipment_needed": "Optional: 1-2 sentences listing required materials/equipment if mentioned",
  "homework": "2-3 sentences with a practical assignment for students to complete",
  "motivational_note": "1 inspiring sentence to encourage students"
}

IMPORTANT:
- Use clear, simple language
- Be specific and concrete (mention actual techniques, muscle names, etc. from transcript)
- Keep it professional but friendly
- Do NOT personalize or address by name
- Do NOT make assumptions beyond what's in the transcript
- Return ONLY valid JSON, no additional text`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert educational content creator. You create clear, structured lesson descriptions based on transcripts. You always respond with valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('Empty response from OpenAI');
    }

    // Parse and validate JSON
    const description = JSON.parse(content);
    
    // Validate required fields
    const requiredFields = [
      'introduction',
      'what_you_will_learn',
      'practical_benefits',
      'key_techniques',
      'homework',
      'motivational_note',
    ];
    
    for (const field of requiredFields) {
      if (!description[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    return description as DefaultDescription;
  } catch (error: any) {
    console.error('❌ Error generating default description:', error.message);
    throw error;
  }
}

/**
 * Process a single lesson
 */
async function processLesson(
  lesson: any,
  courseTitle: string,
  supabase: ReturnType<typeof createClient<Database>>,
  forceRegenerate: boolean = false
): Promise<boolean> {
  console.log('\n' + '━'.repeat(70));
  console.log(`📚 УРОК ${lesson.lesson_number}: ${lesson.title}`);
  console.log('━'.repeat(70) + '\n');

  try {
    // Check if default description already exists
    if (lesson.default_description && !forceRegenerate) {
      console.log('⏭️  Описание по умолчанию уже существует, пропускаем...\n');
      return true;
    }

    // Check if transcript exists
    const transcript = lesson.content?.transcription;
    if (!transcript) {
      console.log('⚠️  Транскрипт отсутствует, пропускаем...\n');
      return false;
    }

    console.log(`📝 Транскрипт: ${transcript.length} символов`);
    console.log('🤖 Генерация описания по умолчанию...\n');

    // Generate default description
    const description = await generateDefaultDescription(
      lesson.lesson_number,
      lesson.title,
      transcript,
      courseTitle
    );

    console.log('✅ Описание создано');
    const introPreview = typeof description.introduction === 'string' 
      ? description.introduction.substring(0, 60) 
      : JSON.stringify(description.introduction).substring(0, 60);
    const techniquesPreview = typeof description.key_techniques === 'string'
      ? description.key_techniques.substring(0, 60)
      : JSON.stringify(description.key_techniques).substring(0, 60);
    
    console.log(`   - Введение: ${introPreview}...`);
    console.log(`   - Ключевые техники: ${techniquesPreview}...`);

    // Save to database
    console.log('\n💾 Сохранение в базу данных...');
    
    const { error } = await (supabase as any)
      .from('lessons')
      .update({
        default_description: description,
      })
      .eq('id', lesson.id);

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    console.log('✅ Сохранено в базу данных\n');
    return true;
  } catch (error: any) {
    console.error(`\n❌ Ошибка обработки урока ${lesson.lesson_number}:`);
    console.error(`   ${error.message}\n`);
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  console.log('\n' + '='.repeat(70));
  console.log('🚀 ГЕНЕРАЦИЯ ОПИСАНИЙ ПО УМОЛЧАНИЮ ДЛЯ УРОКОВ');
  console.log('='.repeat(70) + '\n');

  // Parse command line arguments
  const args = process.argv.slice(2);
  const targetCourseSlug = args.find(arg => !arg.startsWith('--'));
  const forceRegenerate = args.includes('--force');

  if (forceRegenerate) {
    console.log('⚠️  Режим: ПЕРЕГЕНЕРАЦИЯ (существующие описания будут перезаписаны)\n');
  }

  // Initialize Supabase
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Учетные данные Supabase не найдены');
  }
  
  const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
    auth: { persistSession: false }
  });

  // Get all courses
  const { data: courses, error: coursesError } = await (supabase
    .from('courses')
    .select('id, slug, title')
    .order('slug') as any);

  if (coursesError || !courses) {
    throw new Error(`Ошибка получения курсов: ${coursesError?.message}`);
  }

  console.log(`📚 Найдено курсов: ${courses.length}\n`);

  // Process each course
  for (const course of courses) {
    // Skip if target course specified and this isn't it
    if (targetCourseSlug && course.slug !== targetCourseSlug) {
      continue;
    }

    console.log('\n' + '═'.repeat(70));
    console.log(`📖 КУРС: ${course.title} (${course.slug})`);
    console.log('═'.repeat(70));

    // Get all lessons for this course
    const { data: lessons, error: lessonsError } = await (supabase
      .from('lessons')
      .select('id, lesson_number, title, content, default_description')
      .eq('course_id', course.id)
      .order('lesson_number') as any);

    if (lessonsError || !lessons) {
      console.error(`❌ Ошибка получения уроков: ${lessonsError?.message}\n`);
      continue;
    }

    console.log(`   Уроков в курсе: ${lessons.length}\n`);

    // Process statistics
    const stats = {
      total: lessons.length,
      successful: 0,
      failed: 0,
      skipped: 0,
    };

    // Process each lesson
    for (const lesson of lessons) {
      const success = await processLesson(lesson, course.title, supabase, forceRegenerate);
      
      if (success) {
        // Check if it was actually saved
        const { data: checkLesson } = await (supabase
          .from('lessons')
          .select('default_description')
          .eq('id', lesson.id)
          .single() as any);

        if (checkLesson?.default_description) {
          stats.successful++;
        } else {
          stats.skipped++;
        }
      } else {
        stats.failed++;
      }

      // Add delay between requests to respect rate limits
      if (lessons.indexOf(lesson) < lessons.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
      }
    }

    // Print course summary
    console.log('\n' + '═'.repeat(70));
    console.log(`📊 ИТОГИ ДЛЯ КУРСА: ${course.slug}`);
    console.log('═'.repeat(70));
    console.log(`Всего уроков: ${stats.total}`);
    console.log(`✅ Успешно создано: ${stats.successful}`);
    console.log(`⏭️  Пропущено: ${stats.skipped}`);
    console.log(`❌ Ошибок: ${stats.failed}`);
    console.log('═'.repeat(70) + '\n');
  }

  console.log('\n✅ Генерация описаний по умолчанию завершена!\n');
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
