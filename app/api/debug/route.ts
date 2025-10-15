import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient();

    // 1. Проверяем пользователя
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, name, user_identifier")
      .eq("user_identifier", "21179358")
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Пользователь не найден" });
    }

    // 2. Проверяем урок
    const { data: lesson } = await supabase
      .from("lessons")
      .select("id, title, lesson_number")
      .ilike("title", "%1 урок повторяйте%")
      .limit(1)
      .maybeSingle();

    if (!lesson) {
      return NextResponse.json({ error: "Урок не найден" });
    }

    // 3. Проверяем персонализацию
    const { data: personalization } = await supabase
      .from("personalized_lesson_descriptions")
      .select("content")
      .eq("profile_id", profile.id)
      .eq("lesson_id", lesson.id)
      .single();

    if (!personalization) {
      return NextResponse.json({ error: "Персонализация не найдена" });
    }

    // 4. Формируем HTML
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
      debug: {
        profile: profile.name,
        lesson: lesson.title,
        contentKeys: Object.keys(content),
        summaryShort: summaryShort,
        whyWatch: whyWatch
      }
    });

  } catch (error) {
    console.error("Debug API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
