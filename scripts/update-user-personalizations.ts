import "dotenv/config";
import { createClient } from '@supabase/supabase-js';
import OpenAI from "openai";
import fs from "fs";
import path from "path";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

async function updateUserPersonalizations(userId: string) {
  console.log(`🔄 Обновляем персонализации для пользователя ${userId}...`);

  try {
    // 1. Получаем профиль пользователя
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, name, survey")
      .eq("user_identifier", userId)
      .single();

    if (profileError || !profile) {
      console.error(`❌ Пользователь ${userId} не найден:`, profileError?.message);
      return;
    }

    console.log(`✅ Найден профиль: ${profile.name}`);

    // 2. Получаем все уроки
    const { data: lessons, error: lessonsError } = await supabase
      .from("lessons")
      .select("id, lesson_number, title")
      .order("lesson_number", { ascending: true });

    if (lessonsError || !lessons) {
      console.error("❌ Ошибка при получении уроков:", lessonsError?.message);
      return;
    }

    console.log(`📚 Найдено ${lessons.length} уроков`);

    // 3. Удаляем старые персонализации
    const { error: deleteError } = await supabase
      .from("personalized_lesson_descriptions")
      .delete()
      .eq("profile_id", profile.id);

    if (deleteError) {
      console.error("❌ Ошибка при удалении старых персонализаций:", deleteError.message);
    } else {
      console.log("🗑️ Старые персонализации удалены");
    }

    // 4. Генерируем новые персонализации
    const results = [];
    for (const lesson of lessons) {
      console.log(`🔄 Генерируем персонализацию для урока ${lesson.lesson_number}...`);
      
      try {
        const personalization = await generateTemplatePersonalization(
          profile.survey,
          lesson,
          profile.name
        );

        // Сохраняем персонализацию
        const { error: saveError } = await supabase
          .from("personalized_lesson_descriptions")
          .insert({
            profile_id: profile.id,
            lesson_id: lesson.id,
            content: personalization,
          });

        if (saveError) {
          console.error(`❌ Ошибка при сохранении урока ${lesson.lesson_number}:`, saveError.message);
          results.push({ lessonNumber: lesson.lesson_number, success: false });
        } else {
          console.log(`✅ Урок ${lesson.lesson_number} обновлен`);
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

/**
 * Генерирует персонализированное описание урока на основе готового шаблона
 */
async function generateTemplatePersonalization(
  surveyData: any,
  lesson: { lesson_number: number; title: string },
  userName: string
): Promise<Record<string, unknown>> {
  // Загружаем шаблон урока
  const templatePath = path.join(process.cwd(), 'store', 'shvz', `${lesson.lesson_number}-${lesson.lesson_number}-${getLessonId(lesson.lesson_number)}-final.json`);
  
  let template: any = {};
  
  if (fs.existsSync(templatePath)) {
    try {
      template = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
    } catch (error) {
      console.error(`Ошибка загрузки шаблона для урока ${lesson.lesson_number}:`, error);
    }
  }

  // Если шаблон не найден, используем базовую структуру
  if (!template.summary_short) {
    template = {
      summary_short: `Урок ${lesson.lesson_number}: ${lesson.title}`,
      why_watch: "Этот урок поможет вам освоить важные техники массажа",
      quick_action: "Просмотрите видео урока внимательно",
      social_share: "Изучаю новые техники массажа!",
      homework_20m: "Просмотрите видео урока и попрактикуйтесь 10-15 минут"
    };
  }

  const prompt = `Ты - опытный преподаватель массажа Анастасия Фомина. Персонализируй готовый шаблон урока на основе анкеты студента.

ШАБЛОН УРОКА:
${JSON.stringify(template, null, 2)}

АНКЕТА СТУДЕНТА:
- Имя: ${userName}
- Мотивация: ${surveyData.motivation?.join(", ") || "не указано"}
- Целевые клиенты: ${surveyData.target_clients || "не указано"}
- Желаемые навыки: ${surveyData.skills_wanted || "не указано"}
- Страхи/опасения: ${surveyData.fears?.join(", ") || "не указано"}
- Ожидаемый результат: ${surveyData.wow_result || "не указано"}
- Модель для практики: ${surveyData.practice_model || "не указано"}

ЗАДАНИЕ:
Персонализируй каждый элемент шаблона, учитывая:
1. Обращайся к студенту по имени
2. Учитывай его мотивацию и цели
3. Адресуй его страхи и опасения
4. Адаптируй домашнее задание под его модель для практики
5. Связывай с его ожидаемым результатом

ФОРМАТ ОТВЕТА (JSON):
{
  "summary_short": "Персонализированное краткое описание",
  "why_watch": "Зачем смотреть этот урок с учетом мотивации студента",
  "quick_action": "Быстрое действие с учетом модели для практики",
  "social_share": "Сообщение для социальных сетей",
  "homework_20m": "Персонализированное домашнее задание на 20 минут"
}

Отвечай ТОЛЬКО валидным JSON, без дополнительного текста.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Ты - опытный преподаватель массажа, который персонализирует готовые шаблоны уроков. Отвечай только валидным JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const content = completion.choices[0]?.message?.content || "{}";
    return JSON.parse(content);
  } catch (error) {
    console.error("OpenAI API error:", error);
    // Возвращаем оригинальный шаблон при ошибке
    return template;
  }
}

/**
 * Получает ID урока для загрузки шаблона
 */
function getLessonId(lessonNumber: number): string {
  const lessonIds: Record<number, string> = {
    1: "1-f9b62dc5-9b76-491d-8b9b-2b72411df740",
    2: "c8a90762-6fca-47a8-80c3-5f454ae05273",
    3: "1c75e3db-9afd-4237-8b8f-16be2b00ae0c",
    4: "61b19549-d1bf-4265-bb1e-ff21ae7891a0",
    5: "5-387be494-dcf4-41a0-83c2-380fdd4f4cc1",
    6: "6-913d5be1-bbfb-4d32-b4d2-157d10551389",
    7: "7-e0f961c1-b8e3-4f57-939d-fb188d2703a9",
    8: "722e1278-2dcf-4e76-baa3-8d674f3abda4",
    9: "56766339-03e0-4c1b-9d99-cc49590ad3fd",
    10: "10-69b9560e-2af2-4690-af44-1398ace0f75e",
    11: "11-8227a790-17ef-489a-8538-afbe2c4c10ce",
    12: "12-26ef3e23-3d2e-4461-80bf-622f26737528",
  };
  
  return lessonIds[lessonNumber] || "";
}

// Запускаем обновление
const userId = process.argv[2] || "21179358";
updateUserPersonalizations(userId).catch(console.error);
