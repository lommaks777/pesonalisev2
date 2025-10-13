import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import OpenAI from "openai";

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
    const userIdentifier = `user_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .insert({
        user_identifier: userIdentifier,
        name: surveyData.real_name,
        course_slug: surveyData.course,
        survey: surveyData as unknown as Record<string, unknown>,
      })
      .select()
      .single();

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

    // 3. Генерируем персонализации для каждого урока
    const personalizationPromises = lessons.map(async (lesson, index) => {
      try {
        const personalization = await generateLessonPersonalization(
          surveyData,
          lesson,
          index === 0 ? [] : lessons.slice(0, index).map(l => l.title)
        );

        // Сохраняем персонализацию
        const { error } = await supabase
          .from("personalized_lesson_descriptions")
          .insert({
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

    await Promise.all(personalizationPromises);

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
 * Генерирует персонализированное описание урока с помощью OpenAI
 */
async function generateLessonPersonalization(
  surveyData: SurveyData,
  lesson: { lesson_number: number; title: string; summary: string | null },
  previousLessons: string[]
): Promise<Record<string, unknown>> {
  const prompt = `Ты - опытный преподаватель массажа. На основе анкеты студента создай персонализированное описание урока в формате JSON.

АНКЕТА СТУДЕНТА:
- Имя: ${surveyData.real_name}
- Мотивация: ${surveyData.motivation.join(", ") || "не указано"}
- Целевые клиенты: ${surveyData.target_clients || "не указано"}
- Желаемые навыки: ${surveyData.skills_wanted || "не указано"}
- Страхи/опасения: ${surveyData.fears.join(", ") || "не указано"}
- Ожидаемый результат: ${surveyData.wow_result || "не указано"}
- Модель для практики: ${surveyData.practice_model || "не указано"}

ИНФОРМАЦИЯ ОБ УРОКЕ:
- Номер урока: ${lesson.lesson_number}
- Название: ${lesson.title}
- Краткое описание: ${lesson.summary || "не указано"}
${previousLessons.length > 0 ? `- Предыдущие уроки: ${previousLessons.join(", ")}` : ""}

ЗАДАНИЕ:
Создай персонализированное описание урока, которое:
1. Обращается к студенту по имени
2. Учитывает его мотивацию и цели
3. Адресует его страхи и опасения
4. Дает конкретные советы с учетом его модели для практики
5. Связывает урок с его ожидаемым результатом
${lesson.lesson_number === 1 ? "6. Мотивирует начать обучение" : `6. Напоминает о прогрессе с предыдущих уроков`}

ФОРМАТ ОТВЕТА (JSON):
{
  "introduction": "Личное обращение к студенту (2-3 предложения)",
  "key_points": ["3-4 ключевых момента урока с учетом анкеты"],
  "practical_tips": ["2-3 практических совета с учетом модели для практики"],
  "motivation": "Мотивирующее сообщение (1-2 предложения)",
  "homework": "Персональное домашнее задание"
}

Отвечай ТОЛЬКО валидным JSON, без дополнительного текста.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Ты - опытный преподаватель массажа, который создает персонализированные описания уроков. Отвечай только валидным JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 800,
    });

    const content = completion.choices[0]?.message?.content || "{}";
    return JSON.parse(content);
  } catch (error) {
    console.error("OpenAI API error:", error);
    // Возвращаем базовую персонализацию при ошибке
    return {
      introduction: `Здравствуйте, ${surveyData.real_name}! Добро пожаловать на урок "${lesson.title}".`,
      key_points: [
        "Изучите основной материал урока",
        "Обратите внимание на технику безопасности",
        "Практикуйтесь регулярно для лучшего результата",
      ],
      practical_tips: [
        "Начните с простых упражнений",
        "Не торопитесь, изучайте материал в комфортном темпе",
      ],
      motivation: "Вы на правильном пути к достижению своих целей!",
      homework: "Просмотрите видео урока и попрактикуйтесь 10-15 минут.",
    };
  }
}

