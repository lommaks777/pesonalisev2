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
  course?: string; // course slug (optional for backward compatibility)
  flush?: boolean; // игнорировать кэш
}

/**
 * POST /api/persona/block
 * Генерирует HTML блок с персонализированным описанием урока
 */
export async function POST(request: NextRequest) {
  try {
    const body: BlockRequest = await request.json();
    const { user_id, lesson, title, course, flush } = body;

    if (!user_id || !lesson) {
      return NextResponse.json(
        { ok: false, error: "user_id and lesson are required" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const supabase = createSupabaseServerClient();

    console.log('[/api/persona/block] Request:', { user_id, lesson, title, course });

    // 1. Получаем профиль пользователя по user_identifier
    // @ts-ignore - Supabase type issues
    const { data: profileData } = await supabase
      .from("profiles")
      .select("id, name, course_id")
      .eq("user_identifier", user_id)
      .maybeSingle();
    
    const profile = profileData as any;
    console.log('[/api/persona/block] Profile found:', profile ? `ID: ${profile.id}, Name: ${profile.name}` : 'Not found');

    // 2. Определяем course_id для поиска урока
    let courseId: string | null = null;
    
    // Если передан course slug, ищем курс по нему
    if (course) {
      // @ts-ignore - Supabase type issues
      const { data: courseDataRaw } = await supabase
        .from("courses")
        .select("id")
        .eq("slug", course)
        .maybeSingle();
      
      const courseData = courseDataRaw as any;
      if (courseData) {
        courseId = courseData.id;
        console.log('[/api/persona/block] Course found by slug:', { slug: course, id: courseId });
      }
    }
    
    // Если course не передан или не найден, используем course_id из профиля
    if (!courseId && profile?.course_id) {
      courseId = profile.course_id;
      console.log('[/api/persona/block] Using course_id from profile:', courseId);
    }

    // 3. Получаем урок - СНАЧАЛА пробуем поиск по номеру, затем по названию
    let lessonData: any = null;
    
    // Если lesson - это число, ищем по lesson_number
    if (/^\d+$/.test(lesson)) {
      const lessonNumber = parseInt(lesson);
      // @ts-ignore - Supabase type issues
      let query: any = supabase
        .from("lessons")
        .select("id, title, lesson_number, course_id")
        .eq("lesson_number", lessonNumber);
      
      // Фильтруем по курсу, если courseId определен
      if (courseId) {
        query = query.eq("course_id", courseId);
      }
      
      const { data: lessonByNumber } = await query
        .limit(1)
        .maybeSingle();
      
      if (lessonByNumber) {
        lessonData = lessonByNumber;
      }
    }
    
    // Если не нашли по номеру, пробуем поиск по названию
    if (!lessonData) {
      let query: any = supabase
        .from("lessons")
        .select("id, title, lesson_number, course_id")
        .ilike("title", `%${lesson}%`);
      
      // Фильтруем по курсу, если courseId определен
      if (courseId) {
        query = query.eq("course_id", courseId);
      }
      
      const { data: lessonByTitle } = await query
        .limit(1)
        .maybeSingle();
      
      if (lessonByTitle) {
        lessonData = lessonByTitle;
      }
    }

    if (!lessonData) {
      console.log('[/api/persona/block] Lesson not found for:', { lesson, courseId });
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
    const html = formatPersonalizedContent(personalization as any);
    
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

