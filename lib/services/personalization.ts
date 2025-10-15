import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PersonalizedContent } from "./openai";

export interface PersonalizationRecord {
  profile_id: string;
  lesson_id: string;
  content: PersonalizedContent | Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

export interface BatchResult {
  successful: number;
  failed: number;
  errors: Array<{ lessonId: string; error: string }>;
}

/**
 * Upserts personalization to database
 */
export async function savePersonalization(
  profileId: string,
  lessonId: string,
  content: PersonalizedContent | Record<string, unknown>
): Promise<void> {
  try {
    const supabase = createSupabaseServerClient();

    const { error } = await supabase
      .from("personalized_lesson_descriptions")
      .upsert({
        profile_id: profileId,
        lesson_id: lessonId,
        content: content as unknown as Record<string, unknown>,
      });

    if (error) {
      console.error(
        `Error saving personalization for lesson ${lessonId}:`,
        error
      );
      throw error;
    }
  } catch (error) {
    console.error("Error in savePersonalization:", error);
    throw error;
  }
}

/**
 * Retrieves single personalization
 * Returns null if not found
 */
export async function getPersonalization(
  profileId: string,
  lessonId: string
): Promise<PersonalizedContent | null> {
  try {
    const supabase = createSupabaseServerClient();

    const { data, error } = await supabase
      .from("personalized_lesson_descriptions")
      .select("content")
      .eq("profile_id", profileId)
      .eq("lesson_id", lessonId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching personalization:", error);
      return null;
    }

    if (!data || !data.content) {
      return null;
    }

    return data.content as PersonalizedContent;
  } catch (error) {
    console.error("Error in getPersonalization:", error);
    return null;
  }
}

/**
 * Removes personalization entry
 */
export async function deletePersonalization(
  profileId: string,
  lessonId: string
): Promise<void> {
  try {
    const supabase = createSupabaseServerClient();

    const { error } = await supabase
      .from("personalized_lesson_descriptions")
      .delete()
      .eq("profile_id", profileId)
      .eq("lesson_id", lessonId);

    if (error) {
      console.error("Error deleting personalization:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error in deletePersonalization:", error);
    throw error;
  }
}

/**
 * Bulk upsert with error tracking
 */
export async function batchSavePersonalizations(
  items: Array<{
    profileId: string;
    lessonId: string;
    content: PersonalizedContent | Record<string, unknown>;
  }>
): Promise<BatchResult> {
  const result: BatchResult = {
    successful: 0,
    failed: 0,
    errors: [],
  };

  for (const item of items) {
    try {
      await savePersonalization(item.profileId, item.lessonId, item.content);
      result.successful++;
    } catch (error) {
      result.failed++;
      result.errors.push({
        lessonId: item.lessonId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return result;
}
