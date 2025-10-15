import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { personalizeLesson, type SurveyData as SurveyDataBase, type LessonInfo } from "@/lib/services/openai";
import { loadLessonTemplate } from "@/lib/services/lesson-templates";
import { upsertProfile } from "@/lib/services/profile";
import { savePersonalization } from "@/lib/services/personalization";

interface SurveyData extends SurveyDataBase {
  real_name: string;
  course: string;
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
    
    const profile = await upsertProfile({
      user_identifier: userIdentifier,
      name: surveyData.real_name,
      course_slug: surveyData.course,
      survey: surveyData,
    });

    if (!profile) {
      console.error("Error creating/updating profile");
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
    const personalizationPromises = lessons.map(async (lesson) => {
      try {
        const template = await loadLessonTemplate(lesson.lesson_number);
        
        const lessonInfo: LessonInfo = {
          lesson_number: lesson.lesson_number,
          title: lesson.title,
          summary: lesson.summary,
        };
        
        const personalization = await personalizeLesson(
          template,
          surveyData,
          profile.name,
          lessonInfo
        );

        // Сохраняем персонализацию
        await savePersonalization(profile.id, lesson.id, personalization);

        return { lessonId: lesson.id, success: true };
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

