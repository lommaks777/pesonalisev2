/**
 * Generate Default Lesson Descriptions
 * 
 * Creates standard, non-personalized descriptions for all lessons
 * These are shown to users who haven't completed the survey
 * 
 * Stores in lessons.default_description (JSONB field)
 */

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { getOpenAIClient } from "../lib/services/openai";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface DefaultDescription {
  introduction: string;
  what_you_will_learn: string[];
  practical_benefits: string;
  key_techniques: string[];
  recommended_for: string;
  preparation_tips: string;
  next_steps: string;
}

/**
 * Generate default description from transcript
 */
async function generateDefaultDescription(
  transcript: string,
  lessonTitle: string,
  lessonNumber: number,
  courseName: string
): Promise<DefaultDescription> {
  const openai = getOpenAIClient();

  const prompt = `Ты - методист курса "${courseName}". Создай СТАНДАРТНОЕ (не персонализированное) описание урока для пользователей, которые ещё не прошли анкетирование.

ИНФОРМАЦИЯ ОБ УРОКЕ:
Номер: ${lessonNumber}
Название: ${lessonTitle}
Курс: ${courseName}

ПОЛНЫЙ ТРАНСКРИПТ УРОКА (${transcript.length} символов):
${transcript}

ЗАДАНИЕ:
Создай структурированное описание урока, основанное ТОЛЬКО на фактах из транскрипта.

СТРУКТУРА (7 разделов):

1. **introduction** (Введение):
   - Краткое описание темы урока
   - Основная цель и ожидаемый результат
   - 2-3 предложения, профессиональный тон
   - НЕ используй обращение по имени

2. **what_you_will_learn** (Что вы узнаете):
   - Массив из 4-6 конкретных навыков/знаний из транскрипта
   - Формат: "Как правильно...", "Техника...", "Принципы..."
   - Каждый пункт ≤ 20 слов
   - Без общих фраз, только конкретика

3. **practical_benefits** (Практическая польза):
   - Как эти знания применяются в реальной работе
   - Какие задачи сможет решать специалист после урока
   - 3-4 предложения
   - Избегай маркетинговых обещаний

4. **key_techniques** (Ключевые техники):
   - Массив из 3-5 основных техник из урока
   - Названия техник или зон работы из транскрипта
   - Каждый пункт ≤ 15 слов
   - Используй профессиональную терминологию

5. **recommended_for** (Рекомендовано для):
   - Для кого этот урок будет особенно полезен
   - Уровень подготовки, тип практики, цели обучения
   - 2-3 предложения
   - Универсальный тон, без персонализации

6. **preparation_tips** (Подготовка к уроку):
   - Что понадобится для практики
   - Как подготовиться к просмотру
   - Рекомендации по отработке
   - 2-3 предложения

7. **next_steps** (Следующие шаги):
   - Что делать после просмотра урока
   - Конкретные действия для закрепления
   - 1-2 предложения

ТРЕБОВАНИЯ:
✓ Работай ТОЛЬКО с фактами из транскрипта
✓ Избегай общих фраз типа "вы научитесь массажу"
✓ Используй профессиональную терминологию
✓ Нейтральный тон, без персонализации
✓ Язык: дружелюбный профессиональный (B1-B2)
✓ Обращение на "вы"

ЗАПРЕТЫ:
✗ Не обращайся по имени
✗ Не упоминай страхи, цели, мотивацию
✗ Не добавляй техники, которых нет в транскрипте
✗ Не давай медицинских обещаний
✗ Не используй маркетинговые клише

ФОРМАТ ОТВЕТА (строго JSON):
{
  "introduction": "строка",
  "what_you_will_learn": ["пункт 1", "пункт 2", "пункт 3", "пункт 4"],
  "practical_benefits": "строка",
  "key_techniques": ["техника 1", "техника 2", "техника 3"],
  "recommended_for": "строка",
  "preparation_tips": "строка",
  "next_steps": "строка"
}

Отвечай ТОЛЬКО валидным JSON без markdown и дополнительного текста.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Ты - методист образовательных курсов. Создаёшь стандартные описания уроков на основе транскриптов. Отвечаешь только валидным JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.6,
      max_tokens: 1500,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content || "{}";
    
    // Clean potential markdown
    let cleanContent = content.trim();
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    }
    if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const parsed = JSON.parse(cleanContent);
    
    // Validate structure
    if (!parsed.introduction || !Array.isArray(parsed.what_you_will_learn)) {
      throw new Error("Invalid response structure");
    }

    return parsed as DefaultDescription;

  } catch (error) {
    console.error(`Error generating default description:`, error);
    
    // Return fallback
    return {
      introduction: `В уроке ${lessonNumber} "${lessonTitle}" вы освоите важные техники и принципы работы, которые расширят ваши профессиональные возможности.`,
      what_you_will_learn: [
        "Основные техники работы, представленные в уроке",
        "Правильную последовательность выполнения приёмов",
        "Критерии эффективности и контроль качества работы",
        "Особенности адаптации под разных клиентов"
      ],
      practical_benefits: "Полученные знания позволят вам уверенно работать с клиентами, правильно выполнять техники и избегать типичных ошибок. Вы сможете адаптировать приёмы под индивидуальные особенности каждого клиента.",
      key_techniques: [
        "Базовые техники из урока",
        "Правильное положение рук и корпуса",
        "Контроль давления и комфорта клиента"
      ],
      recommended_for: "Этот урок подходит как начинающим специалистам, так и практикующим мастерам, желающим систематизировать знания и освоить новые подходы в работе.",
      preparation_tips: "Для практики понадобятся базовые материалы: массажное масло или крем, чистые полотенца, удобная поверхность для работы. Рекомендуется иметь возможность практиковать на модели.",
      next_steps: "После просмотра урока попрактикуйте основные техники, делая заметки по ключевым моментам. Начните с базовых движений и постепенно переходите к более сложным элементам."
    };
  }
}

/**
 * Process all lessons for a course
 */
async function processAllLessons(courseSlug?: string) {
  console.log("======================================================================");
  console.log("🎨 ГЕНЕРАЦИЯ СТАНДАРТНЫХ ОПИСАНИЙ УРОКОВ");
  console.log("======================================================================");
  
  if (courseSlug) {
    console.log(`📚 Курс: ${courseSlug}`);
  } else {
    console.log("📚 Обработка всех курсов");
  }
  
  console.log("======================================================================\n");

  // Get courses
  const coursesQuery = courseSlug
    ? supabase.from("courses").select("*").eq("slug", courseSlug)
    : supabase.from("courses").select("*");

  const { data: courses, error: coursesError } = await coursesQuery;

  if (coursesError || !courses || courses.length === 0) {
    console.error("❌ Ошибка загрузки курсов:", coursesError);
    return;
  }

  console.log(`✅ Найдено курсов: ${courses.length}\n`);

  for (const course of courses) {
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📚 Курс: ${course.name} (${course.slug})`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    // Get lessons with transcripts
    const { data: lessons, error: lessonsError } = await supabase
      .from("lessons")
      .select("*")
      .eq("course_id", course.id)
      .not("content", "is", null)
      .order("lesson_number");

    if (lessonsError || !lessons || lessons.length === 0) {
      console.log(`⚠️  Уроков с транскриптами не найдено\n`);
      continue;
    }

    console.log(`✅ Найдено уроков с транскриптами: ${lessons.length}\n`);

    let processed = 0;
    let skipped = 0;
    let errors = 0;

    for (const lesson of lessons) {
      const transcript = lesson.content?.transcription;
      
      if (!transcript || transcript.trim().length < 500) {
        console.log(`⏭️  Урок ${lesson.lesson_number}: транскрипт слишком короткий, пропуск`);
        skipped++;
        continue;
      }

      // Check if default_description already exists
      if (lesson.default_description && Object.keys(lesson.default_description).length > 0) {
        console.log(`⏭️  Урок ${lesson.lesson_number} "${lesson.title}": описание уже существует, пропуск`);
        skipped++;
        continue;
      }

      console.log(`🔄 Урок ${lesson.lesson_number}: "${lesson.title}"`);
      console.log(`   Транскрипт: ${transcript.length} символов`);

      try {
        // Generate description
        const description = await generateDefaultDescription(
          transcript,
          lesson.title,
          lesson.lesson_number,
          course.name
        );

        // Save to database
        const { error: updateError } = await supabase
          .from("lessons")
          .update({ default_description: description })
          .eq("id", lesson.id);

        if (updateError) {
          console.error(`   ❌ Ошибка сохранения:`, updateError);
          errors++;
        } else {
          console.log(`   ✅ Описание сгенерировано и сохранено\n`);
          processed++;
        }

        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`   ❌ Ошибка обработки:`, error);
        errors++;
      }
    }

    console.log(`\n📊 Статистика для курса "${course.name}":`);
    console.log(`   ✅ Обработано: ${processed}`);
    console.log(`   ⏭️  Пропущено: ${skipped}`);
    console.log(`   ❌ Ошибок: ${errors}\n`);
  }

  console.log("======================================================================");
  console.log("✅ ГЕНЕРАЦИЯ ЗАВЕРШЕНА");
  console.log("======================================================================");
}

// Main
const courseSlug = process.argv[2]; // Optional course slug argument
processAllLessons(courseSlug).catch(console.error);
