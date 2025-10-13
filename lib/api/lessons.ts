import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

export type LessonWithDescription = Database["public"]["Tables"]["lessons"]["Row"] & {
  lesson_descriptions?: {
    data: unknown;
  } | null;
};

export async function getLessons(): Promise<LessonWithDescription[]> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("lessons")
    .select("*, lesson_descriptions(data)")
    .order("lesson_number", { ascending: true });

  if (error) {
    console.error("Не удалось получить уроки:", error.message);
    return [];
  }

  return data ?? [];
}
