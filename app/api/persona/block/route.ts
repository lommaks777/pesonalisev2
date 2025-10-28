import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CORS_HEADERS, createOptionsHandler } from "@/lib/utils/http";
import { formatPersonalizedContent, formatSurveyAlert, formatNotFoundAlert, formatPersonalizationUnavailableAlert, formatDefaultTemplateContent } from "@/lib/services/html-formatter";
import { getPersonalization, savePersonalization } from "@/lib/services/personalization";
import { loadLessonTemplate, detectTemplateFormat, transformEmojiToNew } from "@/lib/services/lesson-templates";
import { loadLessonTranscript, generatePersonalizedDescription } from "@/lib/services/personalization-engine";

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

    // 1. Определяем course_id и course_slug СНАЧАЛА
    let courseId: string | null = null;
    let courseSlug: string | null = null;
    
    // Если передан course slug, ищем курс по нему
    if (course) {
      const { data: courseDataRaw } = await (supabase
        .from("courses")
        .select("id, slug")
        .eq("slug" as any, course as any)
        .maybeSingle() as any);
      
      const courseData = courseDataRaw as any;
      if (courseData) {
        courseId = courseData.id;
        courseSlug = courseData.slug;
        console.log('[/api/persona/block] Course found by slug:', { slug: course, id: courseId });
      } else {
        console.log('[/api/persona/block] ❌ Course not found by slug:', course);
        return NextResponse.json({
          ok: false,
          error: `Course "${course}" not found`,
          html: '',
        }, { status: 404, headers: CORS_HEADERS });
      }
    }

    // 2. Получаем профиль пользователя - ФИЛЬТРУЕМ ПО КУРСУ!
    let profileData: any = null;
    let profileError: any = null;
    
    if (courseSlug) {
      // Если курс указан, ищем профиль ДЛЯ ЭТОГО курса
      const result = await (supabase
        .from("profiles")
        .select("id, name, course_slug, survey")
        .eq("user_identifier" as any, user_id as any)
        .eq("course_slug" as any, courseSlug as any)
        .maybeSingle() as any);
      profileData = result.data;
      profileError = result.error;
      console.log('[/api/persona/block] Profile lookup (filtered by course):', {
        user_id,
        course: courseSlug,
        found: !!profileData,
        has_survey: !!(profileData?.survey),
        error: profileError
      });
    } else {
      // Если курс не указан, берем любой профиль (старое поведение)
      const result = await (supabase
        .from("profiles")
        .select("id, name, course_slug, survey")
        .eq("user_identifier" as any, user_id as any)
        .maybeSingle() as any);
      profileData = result.data;
      profileError = result.error;
      console.log('[/api/persona/block] Profile lookup (no course filter):', {
        user_id,
        found: !!profileData,
        has_survey: !!(profileData?.survey),
        error: profileError
      });
    }
    
    const profile = profileData as any;
    
    if (profile) {
      console.log('[/api/persona/block] Profile details:', {
        id: profile.id,
        name: profile.name,
        course_slug: profile.course_slug,
        survey_keys: profile.survey ? Object.keys(profile.survey) : []
      });
    }

    // Если course не передан, используем course_slug из профиля
    if (!courseId && profile?.course_slug) {
      console.log('[/api/persona/block] No course param, using profile.course_slug:', profile.course_slug);
      
      const { data: profileCourseData } = await (supabase
        .from("courses")
        .select("id, slug")
        .eq("slug" as any, profile.course_slug as any)
        .maybeSingle() as any);
      
      if (profileCourseData) {
        courseId = (profileCourseData as any).id;
        courseSlug = (profileCourseData as any).slug;
        console.log('[/api/persona/block] Using course_id from profile course_slug:', courseId);
      }
    }
    
    // Если courseId все еще не определен - ошибка
    if (!courseId) {
      console.log('[/api/persona/block] ❌ No course specified and no profile course_slug');
      return NextResponse.json({
        ok: false,
        error: 'Course must be specified or user must have a course in profile',
        html: '',
      }, { status: 400, headers: CORS_HEADERS });
    }

    // 3. Получаем урок - СТРОГО по номеру урока + course_id
    let lessonData: any = null;
    
    // Если lesson - это число, ищем по lesson_number + course_id
    if (/^\d+$/.test(lesson)) {
      const lessonNumber = parseInt(lesson);
      const { data: lessonByNumber } = await (supabase
        .from("lessons")
        .select("id, title, lesson_number, course_id, content, default_description, transcription")
        .eq("lesson_number" as any, lessonNumber as any)
        .eq("course_id" as any, courseId as any) // ОБЯЗАТЕЛЬНАЯ проверка по курсу
        .maybeSingle() as any);
      
      if (lessonByNumber) {
        lessonData = lessonByNumber;
        console.log('[/api/persona/block] ✅ Lesson found by number + course:', { 
          lesson: lessonNumber, 
          course: courseSlug,
          title: lessonData.title,
          has_direct_transcription: !!lessonData.transcription,
          has_content_transcription: !!(lessonData.content?.transcription)
        });
      }
    }
    
    // Если не нашли по номеру, пробуем поиск по названию (но ТОЛЬКО в рамках курса)
    if (!lessonData) {
      const { data: lessonByTitle } = await (supabase
        .from("lessons")
        .select("id, title, lesson_number, course_id, content, default_description, transcription")
        .ilike("title" as any, `%${lesson}%` as any)
        .eq("course_id" as any, courseId as any) // ОБЯЗАТЕЛЬНАЯ проверка по курсу
        .limit(1)
        .maybeSingle() as any);
      
      if (lessonByTitle) {
        lessonData = lessonByTitle;
        console.log('[/api/persona/block] ✅ Lesson found by title + course:', { 
          title: lessonData.title,
          course: courseSlug,
          has_direct_transcription: !!lessonData.transcription,
          has_content_transcription: !!(lessonData.content?.transcription)
        });
      }
    }

    if (!lessonData) {
      console.log('[/api/persona/block] ❌ Lesson not found for:', { lesson, course: courseSlug });
      // Урок не найден в указанном курсе - не показываем ничего
      return NextResponse.json({
        ok: false,
        error: `Lesson "${lesson}" not found in course "${courseSlug}"`,
        html: '',
      }, { status: 404, headers: CORS_HEADERS });
    }
    
    console.log('[/api/persona/block] Lesson found:', { id: lessonData.id, number: lessonData.lesson_number, title: lessonData.title });

    if (!profile) {
      console.log('[/api/persona/block] Profile not found, returning default description');
      // Пользователь не найден - возвращаем default_description из БД
      
      const defaultDescription = (lessonData as any).default_description;
      
      if (!defaultDescription) {
        console.log('[/api/persona/block] ⚠️ No default_description available for this lesson');
        return NextResponse.json({
          ok: false,
          error: 'No default description available for this lesson',
          html: '',
        }, { status: 404, headers: CORS_HEADERS });
      }
      
      console.log('[/api/persona/block] Using default_description from database');
      
      const html = formatDefaultTemplateContent(
        defaultDescription,
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

    // 3. Get or generate personalization for this lesson
    let personalization = await getPersonalization(profile.id, lessonData.id);
    
    console.log('[/api/persona/block] Personalization found:', personalization ? 'Yes' : 'No');
    console.log('[/api/persona/block] Flush requested:', flush);
    
    // If flush is true, regenerate personalization
    if (flush && personalization) {
      console.log('[/api/persona/block] Flush=true, deleting existing personalization...');
      
      // Delete old personalization
      const supabase = createSupabaseServerClient();
      await supabase
        .from('personalized_lesson_descriptions')
        .delete()
        .eq('profile_id', profile.id)
        .eq('lesson_id', lessonData.id);
      
      personalization = null; // Force regeneration
      console.log('[/api/persona/block] Old personalization deleted');
    }
    
    if (!personalization) {
      // Try to generate personalization if it doesn't exist or flush requested
      console.log('[/api/persona/block] Attempting to generate personalization...');
      
      // Load transcript
      const transcriptData = await loadLessonTranscript(lessonData.id);
      
      if (transcriptData && profile.survey) {
        console.log('[/api/persona/block] Transcript found, generating with AI...');
        console.log('[/api/persona/block] Using name:', profile.name);
        
        try {
          const personalizedContent = await generatePersonalizedDescription(
            lessonData.id,
            transcriptData.transcription,
            {
              lesson_number: lessonData.lesson_number,
              title: lessonData.title,
            },
            profile.survey as any,
            profile.name || 'Friend'
          );
          
          // Save the generated personalization
          await savePersonalization(profile.id, lessonData.id, personalizedContent);
          
          // Retrieve the saved personalization
          personalization = await getPersonalization(profile.id, lessonData.id);
          
          console.log('[/api/persona/block] ✅ Personalization generated and saved');
        } catch (generateError) {
          console.error('[/api/persona/block] Error generating personalization:', generateError);
          // Continue to return default if generation fails
        }
      } else {
        console.log('[/api/persona/block] Cannot generate: missing transcript or survey');
      }
    }
    
    if (personalization) {
      console.log('[/api/persona/block] Personalization keys:', Object.keys(personalization));
    }

    if (!personalization) {
      console.log('[/api/persona/block] No personalization available, returning default description');
      
      // Return default description if available
      const defaultDescription = (lessonData as any).default_description;
      
      if (defaultDescription) {
        const html = formatDefaultTemplateContent(
          defaultDescription,
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
      
      // Last resort: return unavailable alert
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

