import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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
  // Добавляем CORS заголовки
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  try {
    const body: BlockRequest = await request.json();
    const { user_id, lesson, title, flush } = body;

    if (!user_id || !lesson) {
      return NextResponse.json(
        { ok: false, error: "user_id and lesson are required" },
        { status: 400, headers: corsHeaders }
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
        html: `
          <div class="persona-block">
            <div class="persona-alert">
              <h3>💡 Персонализация недоступна</h3>
              <p>Заполните анкету, чтобы получить персональные рекомендации для этого урока.</p>
              <a href="/survey/iframe?uid=${user_id}" class="persona-btn" target="_blank">
                Заполнить анкету →
              </a>
            </div>
          </div>
        `,
      }, { headers: corsHeaders });
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
        html: `
          <div class="persona-block">
            <div class="persona-alert persona-warning">
              <p>Урок "${title}" не найден в базе данных.</p>
            </div>
          </div>
        `,
      }, { headers: corsHeaders });
    }

    // 3. Получаем персонализацию для этого урока
    const { data: personalization } = await supabase
      .from("personalized_lesson_descriptions")
      .select("content")
      .eq("profile_id", profile.id)
      .eq("lesson_id", lessonData.id)
      .maybeSingle();

    if (!personalization || !personalization.content) {
      return NextResponse.json({
        ok: true,
        html: `
          <div class="persona-block">
            <div class="persona-alert">
              <h3>📝 Персонализация недоступна</h3>
              <p>Для этого урока еще не создано персональное описание. Пожалуйста, заполните анкету, чтобы получить персонализированные рекомендации.</p>
              <a href="/survey/iframe?uid=${user_id}" class="persona-btn" target="_blank">
                Заполнить анкету →
              </a>
            </div>
          </div>
        `,
      }, { headers: corsHeaders });
    }

    // 4. Формируем HTML из персонализации
    const content = personalization.content as Record<string, unknown>;
    const summaryShort = content.summary_short as string || "";
    const prevLessons = content.prev_lessons as string || "";
    const whyWatch = content.why_watch as string || "";
    const quickAction = content.quick_action as string || "";
    const socialShare = content.social_share as string || "";
    const homework20m = content.homework_20m as string || "";

    const html = `
      <div class="persona-block">
        ${summaryShort ? `
          <div class="persona-section">
            <h3 class="persona-section-title">📝 О уроке</h3>
            <p class="persona-text">${summaryShort}</p>
          </div>
        ` : ''}

        ${prevLessons ? `
          <div class="persona-section">
            <h3 class="persona-section-title">📚 Что мы изучили</h3>
            <p class="persona-text">${prevLessons}</p>
          </div>
        ` : ''}

        ${whyWatch ? `
          <div class="persona-section">
            <h3 class="persona-section-title">🎯 Зачем смотреть</h3>
            <p class="persona-text">${whyWatch}</p>
          </div>
        ` : ''}

        ${quickAction ? `
          <div class="persona-section">
            <h3 class="persona-section-title">⚡ Быстрое действие</h3>
            <p class="persona-text">${quickAction}</p>
          </div>
        ` : ''}

        ${homework20m ? `
          <div class="persona-section persona-homework">
            <h3 class="persona-section-title">📚 Домашнее задание (20 мин)</h3>
            <p class="persona-text">${homework20m}</p>
          </div>
        ` : ''}

        ${socialShare ? `
          <div class="persona-section persona-social">
            <h3 class="persona-section-title">📱 Поделиться</h3>
            <p class="persona-text">${socialShare}</p>
          </div>
        ` : ''}
      </div>
    `;

    return NextResponse.json({
      ok: true,
      html: html,
      cached: !flush,
    }, { headers: corsHeaders });

  } catch (error) {
    console.error("Error in POST /api/persona/block:", error);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500, headers: corsHeaders }
    );
  }
}

// Добавляем обработчик OPTIONS для CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

