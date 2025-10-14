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
  try {
    const body: BlockRequest = await request.json();
    const { user_id, lesson, title, flush } = body;

    if (!user_id || !lesson) {
      return NextResponse.json(
        { ok: false, error: "user_id and lesson are required" },
        { status: 400 }
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
      });
    }

    // 2. Получаем урок по slug (ищем в title или другом поле)
    // Для простоты будем искать по частичному совпадению названия
    const { data: lessonData } = await supabase
      .from("lessons")
      .select("id, title, lesson_number")
      .ilike("title", `%${lesson}%`)
      .limit(1)
      .maybeSingle();

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
      });
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
              <h3>📝 Персонализация в процессе</h3>
              <p>Для этого урока еще не создано персональное описание. Пожалуйста, заполните анкету заново или обратитесь к администратору.</p>
            </div>
          </div>
        `,
      });
    }

    // 4. Формируем HTML из персонализации
    const content = personalization.content as Record<string, unknown>;
    const introduction = content.introduction as string || "";
    const keyPoints = (content.key_points as string[]) || [];
    const practicalTips = (content.practical_tips as string[]) || [];
    const motivation = content.motivation as string || "";
    const homework = content.homework as string || "";

    const html = `
      <div class="persona-block">
        <div class="persona-header">
          <h2 class="persona-title">🎯 ${title}</h2>
          <span class="persona-badge">Персонализировано для ${profile.name}</span>
        </div>

        ${introduction ? `
          <div class="persona-section">
            <h3 class="persona-section-title">👋 Введение</h3>
            <p class="persona-text">${introduction}</p>
          </div>
        ` : ''}

        ${keyPoints.length > 0 ? `
          <div class="persona-section">
            <h3 class="persona-section-title">🔑 Ключевые моменты</h3>
            <ul class="persona-list">
              ${keyPoints.map(point => `<li>${point}</li>`).join('')}
            </ul>
          </div>
        ` : ''}

        ${practicalTips.length > 0 ? `
          <div class="persona-section">
            <h3 class="persona-section-title">💡 Практические советы</h3>
            <ul class="persona-list">
              ${practicalTips.map(tip => `<li>${tip}</li>`).join('')}
            </ul>
          </div>
        ` : ''}

        ${motivation ? `
          <div class="persona-section persona-motivation">
            <p class="persona-text">${motivation}</p>
          </div>
        ` : ''}

        ${homework ? `
          <div class="persona-section persona-homework">
            <h3 class="persona-section-title">📚 Домашнее задание</h3>
            <p class="persona-text">${homework}</p>
          </div>
        ` : ''}
      </div>
    `;

    return NextResponse.json({
      ok: true,
      html: html,
      cached: !flush,
    });

  } catch (error) {
    console.error("Error in POST /api/persona/block:", error);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

