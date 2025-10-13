import { createSupabaseServerClient } from "@/lib/supabase/server";

export type Personalization = {
  lesson_id: string;
  content: unknown;
};

export async function getPersonalizationsByProfile(
  profileId: string
): Promise<Personalization[]> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("personalized_lesson_descriptions")
    .select("lesson_id, content")
    .eq("profile_id", profileId)
    .order("lesson_id");

  if (error) {
    console.error("Не удалось получить персонализации:", error.message);
    return [];
  }

  return (data ?? []) as Personalization[];
}




