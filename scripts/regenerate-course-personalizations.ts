#!/usr/bin/env tsx
import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';
import { getOpenAIClient } from '../lib/services/openai';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Отсутствуют переменные окружения Supabase');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Функция генерации персонализации (копия из personalization-engine.ts с исправленным промптом)
async function generatePersonalizedDescription(
  lessonId: string,
  transcript: string,
  lessonMetadata: { lesson_number: number; title: string },
  surveyData: any,
  userName: string
): Promise<any> {
  const openai = getOpenAIClient();

  const prompt = `Ты - опытный методолог курса массажа и копирайтер. Твоя задача - создать ГЛУБОКО ПЕРСОНАЛИЗИРОВАННОЕ описание урока на основе полной расшифровки видео и детальной анкеты студента.

ИНФОРМАЦИЯ ОБ УРОКЕ:
Номер урока: ${lessonMetadata.lesson_number}
Название: ${lessonMetadata.title}

ПОЛНАЯ РАСШИФРОВКА УРОКА (${transcript.length} символов):
${transcript.substring(0, 15000)}${transcript.length > 15000 ? '...' : ''}

АНКЕТА СТУДЕНТА:
- Имя: ${userName}
- Мотивация: ${surveyData.motivation?.join(', ') || 'не указано'}
- Целевые клиенты: ${surveyData.target_clients || 'не указано'}
- Желаемые навыки: ${surveyData.skills_wanted || 'не указано'}
- Страхи/опасения: ${surveyData.fears?.join(', ') || 'не указано'}
- Желаемый wow-результат: ${surveyData.wow_result || 'не указано'}
- Модель практики: ${surveyData.practice_model || 'не указано'}

ЗАДАНИЕ:
Создай персонализированное описание урока.

КРИТЕРИИ КАЧЕСТВА:
✓ Каждый раздел должен содержать КОНКРЕТНЫЕ ссылки на содержание урока
✓ Избегай общих фраз типа "вы научитесь массажу" - будь КОНКРЕТЕН
✓ Используй терминологию и примеры из расшифровки
✓ Каждое утверждение должно демонстрировать знание как урока, так и профиля студента
✓ Язык: дружелюбный, профессиональный, обращение на "вы"
✓ Уровень языка: B1-B2 (понятно без специальной подготовки)
✓ ВСЕ ТЕКСТЫ ТОЛЬКО НА РУССКОМ ЯЗЫКЕ (RUSSIAN LANGUAGE ONLY)

ФОРМАТ ОТВЕТА (строго JSON):
{
  "introduction": "строка",
  "why_it_matters_for_you": "строка",
  "key_takeaways": ["пункт 1", "пункт 2", "пункт 3"],
  "practical_application": "строка",
  "addressing_fears": "строка",
  "personalized_homework": "строка",
  "motivational_quote": "строка"
}

Отвечай ТОЛЬКО валидным JSON на РУССКОМ языке без markdown-разметки и дополнительного текста.`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: 'Ты - опытный методолог курса массажа и копирайтер. Создаёшь глубоко персонализированные описания уроков. Отвечаешь только валидным JSON на РУССКОМ языке. You must respond in Russian language only.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.7,
    max_tokens: 2500,
    response_format: { type: 'json_object' },
  });

  const content = completion.choices[0]?.message?.content || '{}';
  let cleanContent = content.trim();
  if (cleanContent.startsWith('```json')) {
    cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  }
  if (cleanContent.startsWith('```')) {
    cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }

  return JSON.parse(cleanContent);
}

interface RegenerationStats {
  totalProfiles: number;
  processedProfiles: number;
  totalLessons: number;
  successfulGenerations: number;
  failedGenerations: number;
  skippedGenerations: number;
}

async function regenerateCoursePersonalizations(courseSlug: string) {
  console.log(`\n🔄 Пересоздание персонализаций для курса: ${courseSlug}\n`);
  console.log('='.repeat(70));

  const stats: RegenerationStats = {
    totalProfiles: 0,
    processedProfiles: 0,
    totalLessons: 0,
    successfulGenerations: 0,
    failedGenerations: 0,
    skippedGenerations: 0,
  };

  try {
    // 1. Получаем курс
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, slug')
      .eq('slug', courseSlug)
      .single();

    if (courseError || !course) {
      console.error(`❌ Курс "${courseSlug}" не найден:`, courseError?.message);
      return;
    }

    console.log(`📚 Курс: ${course.slug}`);
    console.log(`📋 ID курса: ${course.id}\n`);

    // 2. Получаем всех пользователей этого курса
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, user_identifier, name, survey')
      .eq('course_slug', courseSlug);

    if (profilesError || !profiles || profiles.length === 0) {
      console.error('❌ Пользователи не найдены:', profilesError?.message);
      return;
    }

    stats.totalProfiles = profiles.length;
    console.log(`👥 Найдено пользователей: ${profiles.length}\n`);

    // 3. Получаем все уроки курса
    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('id, lesson_number, title, content')
      .eq('course_id', course.id)
      .order('lesson_number', { ascending: true });

    if (lessonsError || !lessons || lessons.length === 0) {
      console.error('❌ Уроки не найдены:', lessonsError?.message);
      return;
    }

    stats.totalLessons = lessons.length;
    console.log(`📖 Найдено уроков: ${lessons.length}\n`);
    console.log('='.repeat(70));

    // 4. Обрабатываем каждого пользователя
    for (const profile of profiles) {
      stats.processedProfiles++;
      
      console.log(`\n[${stats.processedProfiles}/${stats.totalProfiles}] 👤 ${profile.name} (${profile.user_identifier})`);

      if (!profile.survey) {
        console.log('   ⚠️  Нет данных анкеты, пропускаем');
        stats.skippedGenerations += lessons.length;
        continue;
      }

      // Удаляем старые персонализации пользователя
      const { error: deleteError } = await supabase
        .from('personalized_lesson_descriptions')
        .delete()
        .eq('profile_id', profile.id);

      if (deleteError) {
        console.error('   ❌ Ошибка удаления старых персонализаций:', deleteError.message);
      } else {
        console.log('   🗑️  Старые персонализации удалены');
      }

      // Генерируем новые персонализации для каждого урока
      for (const lesson of lessons) {
        try {
          // Проверяем наличие транскрипции
          const transcriptData = lesson.content as any;
          
          if (!transcriptData?.transcription) {
            console.log(`   ⚠️  Урок ${lesson.lesson_number}: нет транскрипции, пропускаем`);
            stats.skippedGenerations++;
            continue;
          }

          // Генерируем персонализацию
          const personalization = await generatePersonalizedDescription(
            lesson.id,
            transcriptData.transcription,
            {
              lesson_number: lesson.lesson_number,
              title: lesson.title,
            },
            profile.survey as any,
            profile.name
          );

          // Сохраняем (используем upsert для обновления существующих)
          const { error: saveError } = await supabase
            .from('personalized_lesson_descriptions')
            .upsert({
              profile_id: profile.id,
              lesson_id: lesson.id,
              content: personalization,
            }, {
              onConflict: 'profile_id,lesson_id'
            });

          if (saveError) {
            console.log(`   ❌ Урок ${lesson.lesson_number}: ошибка сохранения - ${saveError.message}`);
            stats.failedGenerations++;
          } else {
            console.log(`   ✅ Урок ${lesson.lesson_number}: готово`);
            stats.successfulGenerations++;
          }

          // Небольшая пауза между запросами к OpenAI
          await new Promise(resolve => setTimeout(resolve, 2000));

        } catch (error) {
          console.log(`   ❌ Урок ${lesson.lesson_number}: ошибка -`, error instanceof Error ? error.message : error);
          stats.failedGenerations++;
        }
      }
    }

    // 5. Итоговая статистика
    console.log('\n' + '='.repeat(70));
    console.log('\n📊 ИТОГОВАЯ СТАТИСТИКА:\n');
    console.log(`👥 Обработано пользователей: ${stats.processedProfiles}/${stats.totalProfiles}`);
    console.log(`📖 Уроков в курсе: ${stats.totalLessons}`);
    console.log(`✅ Успешно сгенерировано: ${stats.successfulGenerations}`);
    console.log(`❌ Ошибок генерации: ${stats.failedGenerations}`);
    console.log(`⚠️  Пропущено: ${stats.skippedGenerations}`);
    
    const totalExpected = stats.totalProfiles * stats.totalLessons;
    const successRate = totalExpected > 0 
      ? ((stats.successfulGenerations / totalExpected) * 100).toFixed(1) 
      : '0';
    
    console.log(`\n📈 Процент успеха: ${successRate}%`);
    console.log('\n' + '='.repeat(70));

  } catch (error) {
    console.error('\n❌ Критическая ошибка:', error);
    throw error;
  }
}

// Запуск скрипта
const courseSlug = process.argv[2] || 'taping-basics';

console.log('\n🚀 Запуск пересоздания персонализаций...');
console.log(`📅 Время начала: ${new Date().toLocaleString('ru-RU')}`);

regenerateCoursePersonalizations(courseSlug)
  .then(() => {
    console.log(`\n✅ Завершено: ${new Date().toLocaleString('ru-RU')}\n`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Процесс завершён с ошибкой\n');
    process.exit(1);
  });
