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
 * Retrieves profile for a specific user and course
 * Returns null if not found
 * @param userId - User identifier
 * @param courseSlug - Course slug (e.g., 'kinesio2', 'shvz')
 */
export async function getProfileByUserIdAndCourse(
  userId: string,
  courseSlug: string
): Promise<Profile | null> {
  try {
    const supabase = createSupabaseServerClient();

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_identifier", userId)
      .eq("course_slug", courseSlug)
      .maybeSingle();

    if (error) {
      console.error("Error fetching profile:", error);
      return null;
    }

    return data as Profile | null;
  } catch (error) {
    console.error("Error in getProfileByUserIdAndCourse:", error);
    return null;
  }
}

/**
 * Retrieves profile with error handling (legacy - gets first profile for user)
 * @deprecated Use getProfileByUserIdAndCourse instead for multi-course support
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
      .limit(1)
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
 * Creates or updates profile for a specific user and course
 * Uses composite unique key (user_identifier + course_slug)
 * Returns the created/updated profile
 */
export async function upsertProfile(
  profileData: ProfileInput
): Promise<Profile | null> {
  try {
    const supabase = createSupabaseServerClient();

    // Check if profile exists for this user + course combination
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_identifier", profileData.user_identifier)
      .eq("course_slug", profileData.course_slug)
      .maybeSingle();

    if (existingProfile) {
      // Update existing profile for this course
      const { data, error } = await supabase
        .from("profiles")
        .update({
          name: profileData.name,
          survey: profileData.survey as unknown as Record<string, unknown>,
        })
        .eq("id", existingProfile.id)
        .select()
        .single();

      if (error) {
        console.error("Error updating profile:", error);
        return null;
      }

      console.log(`[Profile] Updated existing profile for user ${profileData.user_identifier} in course ${profileData.course_slug}`);
      return data as Profile;
    } else {
      // Create new profile for this course
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

      console.log(`[Profile] Created new profile for user ${profileData.user_identifier} in course ${profileData.course_slug}`);
      return data as Profile;
    }
  } catch (error) {
    console.error("Error in upsertProfile:", error);
    return null;
  }
}

/**
 * Retrieves only survey data for a user and course
 * Returns null if profile not found
 */
export async function getProfileSurvey(
  userId: string,
  courseSlug: string
): Promise<SurveyData | null> {
  try {
    const profile = await getProfileByUserIdAndCourse(userId, courseSlug);
    
    if (!profile || !profile.survey) {
      return null;
    }

    return profile.survey as SurveyData;
  } catch (error) {
    console.error("Error in getProfileSurvey:", error);
    return null;
  }
}

/**
 * Get all profiles for a user across all courses
 */
export async function getAllProfilesForUser(
  userId: string
): Promise<Profile[]> {
  try {
    const supabase = createSupabaseServerClient();

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_identifier", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching profiles:", error);
      return [];
    }

    return (data as Profile[]) || [];
  } catch (error) {
    console.error("Error in getAllProfilesForUser:", error);
    return [];
  }
}
