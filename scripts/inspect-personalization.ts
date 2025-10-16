import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

// Load .env.local
config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectPersonalization(userIdentifier: string, lessonNumber: number) {
  // Get profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_identifier", userIdentifier)
    .single();

  if (!profile) {
    console.error("Profile not found");
    return;
  }

  // Get lesson
  const { data: lesson } = await supabase
    .from("lessons")
    .select("id, lesson_number, title")
    .eq("lesson_number", lessonNumber)
    .single();

  if (!lesson) {
    console.error("Lesson not found");
    return;
  }

  console.log("Profile ID:", profile.id);
  console.log("Lesson ID:", lesson.id);
  console.log("Lesson:", lesson.lesson_number, "-", lesson.title);

  // Get personalization
  const { data: pers, error } = await supabase
    .from("personalized_lesson_descriptions")
    .select("*")
    .eq("profile_id", profile.id)
    .eq("lesson_id", lesson.id)
    .maybeSingle();

  if (error) {
    console.error("Error:", error);
    return;
  }

  if (!pers) {
    console.error("No personalization found");
    return;
  }

  console.log("\nPersonalization found:");
  console.log("Content keys:", Object.keys(pers.content || {}));
  console.log("\nContent structure:");
  console.log(JSON.stringify(pers.content, null, 2));
}

const userIdentifier = process.argv[2] || "21179358";
const lessonNumber = parseInt(process.argv[3] || "1");

inspectPersonalization(userIdentifier, lessonNumber).catch(console.error);
