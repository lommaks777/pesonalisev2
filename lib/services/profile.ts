import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SurveyData } from "./openai";

export interface Profile {
  id: string;
  user_identifier: string;
  name: string;
  course_slug: string;
  survey: SurveyData | Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

export interface ProfileInput {
  user_identifier: string;
  name: string;
  course_slug: string;
  survey: SurveyData | Record<string, unknown>;
}

/**
 * Retrieves profile with error handling
 * Returns null if not found
 */
export async function getProfileByUserId(
  userId: string
): Promise<Profile | null> {
  try {
    const supabase = createSupabaseServerClient();

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_identifier", userId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching profile:", error);
      return null;
    }

    return data as Profile | null;
  } catch (error) {
    console.error("Error in getProfileByUserId:", error);
    return null;
  }
}

/**
 * Creates or updates profile
 * Returns the created/updated profile
 */
export async function upsertProfile(
  profileData: ProfileInput
): Promise<Profile | null> {
  try {
    const supabase = createSupabaseServerClient();

    // Check if profile exists
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_identifier", profileData.user_identifier)
      .maybeSingle();

    if (existingProfile) {
      // Update existing
      const { data, error } = await supabase
        .from("profiles")
        .update({
          name: profileData.name,
          course_slug: profileData.course_slug,
          survey: profileData.survey as unknown as Record<string, unknown>,
        })
        .eq("id", existingProfile.id)
        .select()
        .single();

      if (error) {
        console.error("Error updating profile:", error);
        return null;
      }

      return data as Profile;
    } else {
      // Create new
      const { data, error } = await supabase
        .from("profiles")
        .insert({
          user_identifier: profileData.user_identifier,
          name: profileData.name,
          course_slug: profileData.course_slug,
          survey: profileData.survey as unknown as Record<string, unknown>,
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating profile:", error);
        return null;
      }

      return data as Profile;
    }
  } catch (error) {
    console.error("Error in upsertProfile:", error);
    return null;
  }
}

/**
 * Retrieves only survey data for a user
 * Returns null if profile not found
 */
export async function getProfileSurvey(
  userId: string
): Promise<SurveyData | null> {
  try {
    const profile = await getProfileByUserId(userId);
    
    if (!profile || !profile.survey) {
      return null;
    }

    return profile.survey as SurveyData;
  } catch (error) {
    console.error("Error in getProfileSurvey:", error);
    return null;
  }
}
