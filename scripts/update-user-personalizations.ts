#!/usr/bin/env tsx
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });
import { createClient } from '@supabase/supabase-js';
import { getOpenAIClient } from "../lib/services/openai";

interface SurveyData {
  motivation?: string[];
  target_clients?: string;
  skills_wanted?: string;
  fears?: string[];
  wow_result?: string;
  practice_model?: string;
}

interface LessonMetadata {
  lesson_number: number;
  title: string;
}

// Конфигурация Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL не задан');
  process.exit(1);
}

const supabaseKey = supabaseServiceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY или NEXT_PUBLIC_SUPABASE_ANON_KEY не задан');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function generatePersonalizedDescription(
  transcript: string,
  lessonMetadata: LessonMetadata,
  survey: SurveyData,
  userName: string
): Promise<any> {
  const openai = getOpenAIClient();

  const prompt = `Ты - опытный методолог курса массажа и копирайтер. Твоя задача - создать ГЛУБОКО ПЕРСОНАЛИЗИРОВАННОЕ описание урока на основе полной расшифровки видео и детальной анкеты студента.

ИНФОРМАЦИЯ ОБ УРОКЕ:
Номер урока: ${lessonMetadata.lesson_number}
Название: ${lessonMetadata.title}

ПОЛНАЯ РАСШИФРОВКА УРОКА (${transcript.length} символов):
${transcript.substring(0, 15000)}${transcript.length > 15000 ? "..." : ""}

АНКЕТА СТУДЕНТА:
- Имя: ${userName}
- Мотивация: ${survey.motivation?.join(", ") || "не указано"}
- Целевые клиенты: ${survey.target_clients || "не указано"}
- Желаемые навыки: ${survey.skills_wanted || "не указано"}
- Страхи/опасения: ${survey.fears?.join(", ") || "не указано"}
- Желаемый wow-результат: ${survey.wow_result || "не указано"}
- Модель практики: ${survey.practice_model || "не указано"}

ЗАДАНИЕ:
Создай персонализированное описание урока, которое демонстрирует КОНКРЕТНУЮ ЦЕННОСТЬ для ЭТОГО студента.

СТРУКТУРА ОПИСАНИЯ (7 разделов):

1. **introduction** (Введение): 2-3 предложения
2. **why_it_matters_for_you** (Почему это важно именно для вас): 4-5 предложений
3. **key_takeaways** (Ключевые выводы): Массив из 3-4 пунктов
4. **practical_application** (Практическое применение): 3-4 предложения
5. **addressing_fears** (Ответ на опасения): 2-3 предложения
6. **personalized_homework** (Персональное домашнее задание): 2-4 предложения
7. **motivational_quote** (Мотивационная фраза): 1 предложение

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

Отвечай ТОЛЬКО валидным JSON без markdown-разметки и дополнительного текста.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Ты - опытный методолог курса массажа и копирайтер. Создаёшь глубоко персонализированные описания уроков. Отвечаешь только валидным JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2500,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content || "{}";
    let cleanContent = content.trim();
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    }
    if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    return JSON.parse(cleanContent);
  } catch (error) {
    console.error("Error generating personalization:", error);
    throw error;
  }
}

async function updateUserPersonalizations(userId: string) {
  console.log(`🔄 Обновляем персонализации для пользователя ${userId}...`);

  try {
    // 1. Получаем профиль пользователя
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, name, survey, course_slug")
      .eq("user_identifier", userId)
      .maybeSingle();

    if (profileError || !profile) {
      console.error(`❌ Пользователь ${userId} не найден:`, profileError?.message);
      return;
    }

    console.log(`✅ Найден профиль: ${profile.name} (курс: ${profile.course_slug})`);

    // 2. Получаем курс ID
    const { data: course } = await supabase
      .from("courses")
      .select("id")
      .eq("slug", profile.course_slug)
      .single();

    if (!course) {
      console.error(`❌ Курс ${profile.course_slug} не найден`);
      return;
    }

    // 3. Получаем все уроки курса с расшифровками
    const { data: lessons, error: lessonsError } = await supabase
      .from("lessons")
      .select("id, lesson_number, title, content")
      .eq("course_id", course.id)
      .order("lesson_number", { ascending: true });

    if (lessonsError || !lessons) {
      console.error("❌ Ошибка при получении уроков:", lessonsError?.message);
      return;
    }

    console.log(`📚 Найдено ${lessons.length} уроков`);

    // 4. Удаляем старые персонализации
    const { error: deleteError } = await supabase
      .from("personalizations")
      .delete()
      .eq("profile_id", profile.id);

    if (deleteError) {
      console.error("❌ Ошибка при удалении старых персонализаций:", deleteError.message);
    } else {
      console.log("🗑️ Старые персонализации удалены");
    }

    // 5. Генерируем новые персонализации с НОВЫМ движком (прямо из расшифровок)
    const results = [];
    for (const lesson of lessons) {
      console.log(`🔄 Генерируем персонализацию для урока ${lesson.lesson_number}...`);
      
      try {
        // Загружаем расшифровку из базы данных
        const transcriptData = lesson.content as any;
        
        if (!transcriptData || !transcriptData.transcription) {
          console.warn(`⚠️  Нет расшифровки для урока ${lesson.lesson_number}, пропускаем`);
          results.push({ lessonNumber: lesson.lesson_number, success: false });
          continue;
        }
        
        const lessonMetadata: LessonMetadata = {
          lesson_number: lesson.lesson_number,
          title: lesson.title,
        };
        
        // Генерируем персонализацию напрямую из расшифровки с GPT-4o
        const personalization = await generatePersonalizedDescription(
          transcriptData.transcription,
          lessonMetadata,
          profile.survey as SurveyData,
          profile.name
        );

        // Сохраняем персонализацию
        const { error: saveError } = await supabase
          .from("personalizations")
          .insert({
            profile_id: profile.id,
            lesson_id: lesson.id,
            content: personalization,
          });

        if (saveError) {
          console.error(`❌ Ошибка при сохранении урока ${lesson.lesson_number}:`, saveError.message);
          results.push({ lessonNumber: lesson.lesson_number, success: false });
        } else {
          console.log(`✅ Урок ${lesson.lesson_number} обновлён (НОВЫЙ движок: прямо из расшифровки)`);
          results.push({ lessonNumber: lesson.lesson_number, success: true });
        }
      } catch (error) {
        console.error(`❌ Ошибка при генерации урока ${lesson.lesson_number}:`, error);
        results.push({ lessonNumber: lesson.lesson_number, success: false });
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`\n🎉 Обновление завершено! Успешно: ${successCount}/${lessons.length}`);

    if (successCount < lessons.length) {
      console.log("❌ Неудачные уроки:");
      results.filter(r => !r.success).forEach(r => {
        console.log(`  - Урок ${r.lessonNumber}`);
      });
    }

  } catch (error) {
    console.error("❌ Критическая ошибка:", error);
  }
}

// Запускаем обновление
const userId = process.argv[2] || "21179358";
updateUserPersonalizations(userId).catch(console.error);
