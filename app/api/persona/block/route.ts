import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CORS_HEADERS, createOptionsHandler } from "@/lib/utils/http";
import { formatPersonalizedContent, formatSurveyAlert, formatNotFoundAlert, formatPersonalizationUnavailableAlert, formatDefaultTemplateContent } from "@/lib/services/html-formatter";
import { getPersonalization } from "@/lib/services/personalization";
import { loadLessonTemplate } from "@/lib/services/lesson-templates";

interface BlockRequest {
  user_id: string;
  lesson: string; // lesson slug
  title: string;
  flush?: boolean; // игнорировать кэш
}

/**
 * POST /api/persona/block
 * Генерирует HTML блок с персонализированным описанием урока
 */
export async function POST(request: NextRequest) {
  try {
    const body: BlockRequest = await request.json();
    const { user_id, lesson, title, flush } = body;

    if (!user_id || !lesson) {
      return NextResponse.json(
        { ok: false, error: "user_id and lesson are required" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const supabase = createSupabaseServerClient();

    console.log('[/api/persona/block] Request:', { user_id, lesson, title });

    // 1. Получаем профиль пользователя по user_identifier
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, name")
      .eq("user_identifier", user_id)
      .maybeSingle();
    
    console.log('[/api/persona/block] Profile found:', profile ? `ID: ${profile.id}, Name: ${profile.name}` : 'Not found');

    // 2. Получаем урок - СНАЧАЛА пробуем поиск по номеру, затем по названию
    let lessonData: any = null;
    
    // Если lesson - это число, ищем по lesson_number
    if (/^\d+$/.test(lesson)) {
      const lessonNumber = parseInt(lesson);
      const { data: lessonByNumber } = await supabase
        .from("lessons")
        .select("id, title, lesson_number")
        .eq("lesson_number", lessonNumber)
        .limit(1)
        .maybeSingle();
      
      if (lessonByNumber) {
        lessonData = lessonByNumber;
      }
    }
    
    // Если не нашли по номеру, пробуем поиск по названию
    if (!lessonData) {
      const { data: lessonByTitle } = await supabase
        .from("lessons")
        .select("id, title, lesson_number")
        .ilike("title", `%${lesson}%`)
        .limit(1)
        .maybeSingle();
      
      if (lessonByTitle) {
        lessonData = lessonByTitle;
      }
    }

    if (!lessonData) {
      console.log('[/api/persona/block] Lesson not found for:', lesson);
      return NextResponse.json({
        ok: true,
        html: formatNotFoundAlert(`Урок "${title}" не найден в базе данных.`),
      }, { headers: CORS_HEADERS });
    }
    
    console.log('[/api/persona/block] Lesson found:', { id: lessonData.id, number: lessonData.lesson_number, title: lessonData.title });

    if (!profile) {
      console.log('[/api/persona/block] Profile not found, returning default template');
      // Пользователь не найден - возвращаем базовый шаблон урока
      const template = await loadLessonTemplate(lessonData.lesson_number);
      const html = formatDefaultTemplateContent(
        template,
        {
          lesson_number: lessonData.lesson_number,
          title: lessonData.title,
        },
        true // include survey CTA
      );
      
      return NextResponse.json({
        ok: true,
        html: html,
      }, { headers: CORS_HEADERS });
    }

    // 3. Получаем персонализацию для этого урока
    const personalization = await getPersonalization(profile.id, lessonData.id);
    
    console.log('[/api/persona/block] Personalization found:', personalization ? 'Yes' : 'No');
    if (personalization) {
      console.log('[/api/persona/block] Personalization keys:', Object.keys(personalization));
    }

    if (!personalization) {
      console.log('[/api/persona/block] No personalization, returning alert');
      return NextResponse.json({
        ok: true,
        html: formatPersonalizationUnavailableAlert(user_id),
      }, { headers: CORS_HEADERS });
    }

    // 4. Формируем HTML из персонализации
    const html = formatPersonalizedContent(personalization);
    
    console.log('[/api/persona/block] Returning personalized content, HTML length:', html.length);

    return NextResponse.json({
      ok: true,
      html: html,
      cached: !flush,
    }, { headers: CORS_HEADERS });

  } catch (error) {
    console.error("Error in POST /api/persona/block:", error);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

// Добавляем обработчик OPTIONS для CORS preflight
export const OPTIONS = createOptionsHandler();

