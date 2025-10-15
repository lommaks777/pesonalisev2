import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CORS_HEADERS, createOptionsHandler } from "@/lib/utils/http";
import { formatPersonalizedContent, formatSurveyAlert, formatNotFoundAlert, formatPersonalizationUnavailableAlert } from "@/lib/services/html-formatter";
import { getPersonalization } from "@/lib/services/personalization";

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

    // 1. Получаем профиль пользователя по user_identifier
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, name")
      .eq("user_identifier", user_id)
      .maybeSingle();

    if (!profile) {
      // Пользователь не заполнил анкету - возвращаем базовое описание
      return NextResponse.json({
        ok: true,
        html: formatSurveyAlert(user_id),
      }, { headers: CORS_HEADERS });
    }

    // 2. Получаем урок по slug (ищем в title или другом поле)
    // Улучшенный поиск: сначала пробуем точное совпадение, затем частичное
    let { data: lessonData } = await supabase
      .from("lessons")
      .select("id, title, lesson_number")
      .ilike("title", `%${lesson}%`)
      .limit(1)
      .maybeSingle();

    // Если не нашли по частичному совпадению, пробуем поиск по номеру урока
    if (!lessonData && /^\d+$/.test(lesson)) {
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

    if (!lessonData) {
      return NextResponse.json({
        ok: true,
        html: formatNotFoundAlert(`Урок "${title}" не найден в базе данных.`),
      }, { headers: CORS_HEADERS });
    }

    // 3. Получаем персонализацию для этого урока
    const personalization = await getPersonalization(profile.id, lessonData.id);

    if (!personalization) {
      return NextResponse.json({
        ok: true,
        html: formatPersonalizationUnavailableAlert(user_id),
      }, { headers: CORS_HEADERS });
    }

    // 4. Формируем HTML из персонализации
    const html = formatPersonalizedContent(personalization);

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

