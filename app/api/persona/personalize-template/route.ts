import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { personalizeLesson, type LessonInfo } from "@/lib/services/openai";
import { loadLessonTemplate } from "@/lib/services/lesson-templates";
import { formatPersonalizedContent, formatSurveyAlert, formatNotFoundAlert, formatDefaultTemplateContent } from "@/lib/services/html-formatter";
import { savePersonalization } from "@/lib/services/personalization";
import { CORS_HEADERS, createOptionsHandler } from "@/lib/utils/http";

interface PersonalizeRequest {
  user_id: string;
  lesson_number: number;
  flush?: boolean;
}

/**
 * POST /api/persona/personalize-template
 * Персонализирует готовые шаблоны уроков на основе анкеты пользователя
 */
export async function POST(request: NextRequest) {
  try {
    const body: PersonalizeRequest = await request.json();
    const { user_id, lesson_number, flush } = body;

    if (!user_id || !lesson_number) {
      return NextResponse.json(
        { ok: false, error: "user_id and lesson_number are required" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const supabase = createSupabaseServerClient();

    // 1. Получаем урок по номеру
    const { data: lesson } = await supabase
      .from("lessons")
      .select("id, title, lesson_number")
      .eq("lesson_number", lesson_number)
      .maybeSingle();

    if (!lesson) {
      return NextResponse.json({
        ok: true,
        html: formatNotFoundAlert(`Урок ${lesson_number} не найден в базе данных.`),
      }, { headers: CORS_HEADERS });
    }

    // 2. Получаем профиль пользователя
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, name, survey")
      .eq("user_identifier", user_id)
      .maybeSingle();

    // 3. Загружаем шаблон урока
    const template = await loadLessonTemplate(lesson_number);

    if (!profile) {
      // Пользователь не найден - возвращаем базовый шаблон
      const html = formatDefaultTemplateContent(
        template,
        {
          lesson_number: lesson.lesson_number,
          title: lesson.title,
        },
        true // include survey CTA
      );
      
      return NextResponse.json({
        ok: true,
        html: html,
      }, { headers: CORS_HEADERS });
    }

    // 4. Персонализируем шаблон
    const lessonInfo: LessonInfo = {
      lesson_number: lesson.lesson_number,
      title: lesson.title,
    };
    
    const personalizedContent = await personalizeLesson(
      template,
      profile.survey,
      profile.name,
      lessonInfo
    );

    // 5. Сохраняем персонализацию
    try {
      await savePersonalization(profile.id, lesson.id, personalizedContent);
    } catch (saveError) {
      console.error("Error saving personalization:", saveError);
    }

    // 6. Формируем HTML
    const html = formatPersonalizedContent(personalizedContent);

    return NextResponse.json({
      ok: true,
      html: html,
      cached: !flush,
    }, { headers: CORS_HEADERS });

  } catch (error) {
    console.error("Error in POST /api/persona/personalize-template:", error);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export const OPTIONS = createOptionsHandler();
