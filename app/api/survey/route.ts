import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import OpenAI from "openai";
import fs from "fs";
import path from "path";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface SurveyData {
  real_name: string;
  course: string;
  motivation: string[];
  target_clients: string;
  skills_wanted: string;
  fears: string[];
  wow_result: string;
  practice_model: string;
  uid?: string; // UID из GetCourse
}

/**
 * POST /api/survey
 * Обрабатывает анкету пользователя:
 * 1. Создает профиль в Supabase
 * 2. Генерирует персонализированные описания для всех уроков с помощью OpenAI
 * 3. Сохраняет персонализации в БД
 */
export async function POST(request: NextRequest) {
  try {
    const surveyData: SurveyData = await request.json();

    // Валидация
    if (!surveyData.real_name || !surveyData.course) {
      return NextResponse.json(
        { error: "Имя и курс обязательны для заполнения" },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServerClient();

    // 1. Создаем профиль пользователя
    // Используем uid из GetCourse или генерируем для гостей
    const userIdentifier = surveyData.uid || `guest_${Date.now()}`;
    
    // Проверяем, существует ли уже профиль с таким uid
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_identifier", userIdentifier)
      .maybeSingle();

    let profile;
    
    if (existingProfile) {
      // Обновляем существующий профиль
      const { data: updated, error: updateError } = await supabase
        .from("profiles")
        .update({
          name: surveyData.real_name,
          course_slug: surveyData.course,
          survey: surveyData as unknown as Record<string, unknown>,
        })
        .eq("id", existingProfile.id)
        .select()
        .single();
      
      if (updateError) {
        console.error("Error updating profile:", updateError);
        return NextResponse.json(
          { error: "Не удалось обновить профиль" },
          { status: 500 }
        );
      }
      profile = updated;
    } else {
      // Создаем новый профиль
      const { data: created, error: createError } = await supabase
        .from("profiles")
        .insert({
          user_identifier: userIdentifier,
          name: surveyData.real_name,
          course_slug: surveyData.course,
          survey: surveyData as unknown as Record<string, unknown>,
        })
        .select()
        .single();
      
      if (createError) {
        console.error("Error creating profile:", createError);
        return NextResponse.json(
          { error: "Не удалось создать профиль" },
          { status: 500 }
        );
      }
      profile = created;
    }

    const { error: profileError } = { error: null }; // Для обратной совместимости

    if (profileError || !profile) {
      console.error("Error creating profile:", profileError);
      return NextResponse.json(
        { error: "Не удалось создать профиль" },
        { status: 500 }
      );
    }

    // 2. Получаем все уроки курса
    const { data: lessons, error: lessonsError } = await supabase
      .from("lessons")
      .select("id, lesson_number, title, summary")
      .eq("course_id", await getCourseId(supabase, surveyData.course))
      .order("lesson_number");

    if (lessonsError || !lessons || lessons.length === 0) {
      console.error("Error fetching lessons:", lessonsError);
      return NextResponse.json(
        { 
          profileId: profile.id,
          warning: "Профиль создан, но уроки не найдены" 
        },
        { status: 200 }
      );
    }

    // 3. Генерируем персонализации для каждого урока на основе готовых шаблонов
    const personalizationPromises = lessons.map(async (lesson, index) => {
      try {
        const personalization = await generateTemplatePersonalization(
          surveyData,
          lesson,
          profile.name
        );

        // Сохраняем персонализацию
        const { error } = await supabase
          .from("personalized_lesson_descriptions")
          .upsert({
            profile_id: profile.id,
            lesson_id: lesson.id,
            content: personalization,
          });

        if (error) {
          console.error(`Error saving personalization for lesson ${lesson.id}:`, error);
        }

        return { lessonId: lesson.id, success: !error };
      } catch (error) {
        console.error(`Error generating personalization for lesson ${lesson.id}:`, error);
        return { lessonId: lesson.id, success: false };
      }
    });

    const results = await Promise.all(personalizationPromises);
    const successCount = results.filter(r => r.success).length;
    console.log(`Generated ${successCount}/${lessons.length} personalizations for user ${userIdentifier}`);

    return NextResponse.json({
      success: true,
      profileId: profile.id,
      userIdentifier: userIdentifier,
      message: "Персональный курс успешно создан!",
    });

  } catch (error) {
    console.error("Error in POST /api/survey:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

/**
 * Получает ID курса по slug
 */
async function getCourseId(supabase: ReturnType<typeof createSupabaseServerClient>, courseSlug: string): Promise<string> {
  const { data } = await supabase
    .from("courses")
    .select("id")
    .eq("slug", courseSlug)
    .single();

  return data?.id || "";
}

/**
 * Генерирует персонализированное описание урока на основе готового шаблона
 */
async function generateTemplatePersonalization(
  surveyData: SurveyData,
  lesson: { lesson_number: number; title: string; summary: string | null },
  userName: string
): Promise<Record<string, unknown>> {
  // Загружаем шаблон урока (поддерживаем разные схемы именования файлов)
  const dir = path.join(process.cwd(), 'store', 'shvz');
  const id = getLessonId(lesson.lesson_number);
  const candidates = [
    `${lesson.lesson_number}-${lesson.lesson_number}-${id}-final.json`,
    `${lesson.lesson_number}-${id}-final.json`,
    `${id}-final.json`,
  ];

  let template: any = {};
  let templatePath = "";
  
  for (const name of candidates) {
    const p = path.join(dir, name);
    if (fs.existsSync(p)) {
      templatePath = p;
      break;
    }
  }

  if (templatePath) {
    try {
      template = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
    } catch (error) {
      console.error(`Error loading template for lesson ${lesson.lesson_number}:`, error);
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
    1: "c8a90762-6fca-47a8-80c3-5f454ae05273",
    2: "26ef3e23-3d2e-4461-80bf-622f26737528",
    3: "56766339-03e0-4c1b-9d99-cc49590ad3fd",
    4: "8227a790-17ef-489a-8538-afbe2c4c10ce",
    5: "f9b62dc5-9b76-491d-8b9b-2b72411df740",
    6: "1c75e3db-9afd-4237-8b8f-16be2b00ae0c",
    7: "387be494-dcf4-41a0-83c2-380fdd4f4cc1",
    8: "61b19549-d1bf-4265-bb1e-ff21ae7891a0",
    9: "e0f961c1-b8e3-4f57-939d-fb188d2703a9",
    10: "913d5be1-bbfb-4d32-b4d2-157d10551389",
    11: "69b9560e-2af2-4690-af44-1398ace0f75e",
    12: "722e1278-2dcf-4e76-baa3-8d674f3abda4",
  };

  return lessonIds[lessonNumber] || "";
}

