import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * POST /api/personalizations
 * Создает или обновляет персонализированное описание урока для профиля
 * 
 * Body:
 * {
 *   "profileId": "uuid",
 *   "lessonId": "uuid",
 *   "content": { ... }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { profileId, lessonId, content } = body;

    // Валидация
    if (!profileId || !lessonId || !content) {
      return NextResponse.json(
        { error: "Missing required fields: profileId, lessonId, content" },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServerClient();

    // Проверяем, существует ли уже персонализация
    const { data: existing } = await supabase
      .from("personalized_lesson_descriptions")
      .select("id")
      .eq("profile_id", profileId)
      .eq("lesson_id", lessonId)
      .maybeSingle();

    let result;

    if (existing) {
      // Обновляем существующую запись
      result = await supabase
        .from("personalized_lesson_descriptions")
        .update({ content })
        .eq("id", existing.id)
        .select()
        .single();
    } else {
      // Создаем новую запись
      result = await supabase
        .from("personalized_lesson_descriptions")
        .insert({
          profile_id: profileId,
          lesson_id: lessonId,
          content,
        })
        .select()
        .single();
    }

    if (result.error) {
      console.error("Supabase error:", result.error);
      return NextResponse.json(
        { error: result.error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      message: existing ? "Персонализация обновлена" : "Персонализация создана",
    });
  } catch (error) {
    console.error("Error in POST /api/personalizations:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/personalizations
 * Удаляет персонализированное описание урока
 * 
 * Body:
 * {
 *   "profileId": "uuid",
 *   "lessonId": "uuid"
 * }
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { profileId, lessonId } = body;

    if (!profileId || !lessonId) {
      return NextResponse.json(
        { error: "Missing required fields: profileId, lessonId" },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServerClient();

    const { error } = await supabase
      .from("personalized_lesson_descriptions")
      .delete()
      .eq("profile_id", profileId)
      .eq("lesson_id", lessonId);

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Персонализация удалена",
    });
  } catch (error) {
    console.error("Error in DELETE /api/personalizations:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

