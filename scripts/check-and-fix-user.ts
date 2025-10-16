import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { loadLessonTemplate } from "../lib/services/lesson-templates.js";
import { personalizeLesson, type SurveyData, type LessonInfo } from "../lib/services/openai.js";

// Load .env.local
config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase credentials");
  console.error("NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl ? "Present" : "Missing");
  console.error("SUPABASE_KEY:", supabaseKey ? "Present" : "Missing");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAndFixUser(userIdentifier: string) {
  console.log(`\n🔍 Checking user: ${userIdentifier}\n`);

  // 1. Проверяем профиль
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_identifier", userIdentifier)
    .maybeSingle();

  if (profileError) {
    console.error("❌ Error fetching profile:", profileError);
    return;
  }

  if (!profile) {
    console.error("❌ Profile not found for user:", userIdentifier);
    return;
  }

  console.log("✅ Profile found:");
  console.log(`   ID: ${profile.id}`);
  console.log(`   Name: ${profile.name}`);
  console.log(`   Created: ${profile.created_at}`);
  console.log(`   Survey data: ${profile.survey ? 'Present' : 'Missing'}`);

  if (!profile.survey) {
    console.error("❌ Survey data is missing. User needs to fill the survey.");
    return;
  }

  // 2. Проверяем персонализации
  const { data: personalizations, error: persError } = await supabase
    .from("personalized_lesson_descriptions")
    .select("id, lesson_id")
    .eq("profile_id", profile.id);

  if (persError) {
    console.error("❌ Error fetching personalizations:", persError);
    return;
  }

  console.log(`\n📊 Existing personalizations: ${personalizations?.length || 0}`);

  // 3. Получаем все уроки
  const { data: lessons, error: lessonsError } = await supabase
    .from("lessons")
    .select("id, lesson_number, title, summary, course_id")
    .order("lesson_number");

  if (lessonsError || !lessons) {
    console.error("❌ Error fetching lessons:", lessonsError);
    return;
  }

  console.log(`\n📚 Total lessons in database: ${lessons.length}`);

  // 4. Генерируем недостающие персонализации
  const existingLessonIds = new Set(personalizations?.map(p => p.lesson_id) || []);
  const missingLessons = lessons.filter(l => !existingLessonIds.has(l.id));

  if (missingLessons.length === 0) {
    console.log("\n✅ All personalizations already exist!");
    return;
  }

  console.log(`\n🔄 Generating ${missingLessons.length} missing personalizations...\n`);

  const surveyData: SurveyData = profile.survey as any;
  let successCount = 0;
  let errorCount = 0;

  for (const lesson of missingLessons) {
    try {
      console.log(`   Processing lesson ${lesson.lesson_number}: ${lesson.title}...`);

      const template = await loadLessonTemplate(lesson.lesson_number);
      
      const lessonInfo: LessonInfo = {
        lesson_number: lesson.lesson_number,
        title: lesson.title,
        summary: lesson.summary || "",
      };

      const personalization = await personalizeLesson(
        template,
        surveyData,
        profile.name,
        lessonInfo
      );

      // Save directly to Supabase instead of using savePersonalization
      const { error: saveError } = await supabase
        .from("personalized_lesson_descriptions")
        .upsert({
          profile_id: profile.id,
          lesson_id: lesson.id,
          content: personalization as any,
        });

      if (saveError) {
        throw saveError;
      }
      
      console.log(`   ✅ Lesson ${lesson.lesson_number} personalized`);
      successCount++;

      // Небольшая пауза между запросами
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error) {
      console.error(`   ❌ Error personalizing lesson ${lesson.lesson_number}:`, error);
      errorCount++;
    }
  }

  console.log(`\n🎉 Generation complete!`);
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
}

// Запуск скрипта
const userIdentifier = process.argv[2] || "21179358";
checkAndFixUser(userIdentifier).catch(console.error);
