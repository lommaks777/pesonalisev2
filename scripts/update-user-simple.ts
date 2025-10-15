import "dotenv/config";
import { createClient } from '@supabase/supabase-js';

// Конфигурация Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL не задан');
  process.exit(1);
}

const supabaseKey = supabaseServiceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY или NEXT_PUBLIC_SUPABASE_ANON_KEY не задан');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateUserPersonalizations(userId: string) {
  console.log(`🔄 Обновляем персонализации для пользователя ${userId}...`);

  try {
    // 1. Получаем профиль пользователя
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, name, survey")
      .eq("user_identifier", userId)
      .single();

    if (profileError || !profile) {
      console.error(`❌ Пользователь ${userId} не найден:`, profileError?.message);
      return;
    }

    console.log(`✅ Найден профиль: ${profile.name}`);

    // 2. Получаем все уроки
    const { data: lessons, error: lessonsError } = await supabase
      .from("lessons")
      .select("id, lesson_number, title")
      .order("lesson_number", { ascending: true });

    if (lessonsError || !lessons) {
      console.error("❌ Ошибка при получении уроков:", lessonsError?.message);
      return;
    }

    console.log(`📚 Найдено ${lessons.length} уроков`);

    // 3. Удаляем старые персонализации
    const { error: deleteError } = await supabase
      .from("personalized_lesson_descriptions")
      .delete()
      .eq("profile_id", profile.id);

    if (deleteError) {
      console.error("❌ Ошибка при удалении старых персонализаций:", deleteError.message);
    } else {
      console.log("🗑️ Старые персонализации удалены");
    }

    // 4. Создаем новые персонализации на основе анкеты
    const results = [];
    for (const lesson of lessons) {
      console.log(`🔄 Создаем персонализацию для урока ${lesson.lesson_number}...`);
      
      try {
        // Создаем базовую персонализацию на основе анкеты
        const personalization = createBasicPersonalization(profile.survey, lesson, profile.name);

        // Сохраняем персонализацию
        const { error: saveError } = await supabase
          .from("personalized_lesson_descriptions")
          .insert({
            profile_id: profile.id,
            lesson_id: lesson.id,
            content: personalization,
          });

        if (saveError) {
          console.error(`❌ Ошибка при сохранении урока ${lesson.lesson_number}:`, saveError.message);
          results.push({ lessonNumber: lesson.lesson_number, success: false });
        } else {
          console.log(`✅ Урок ${lesson.lesson_number} обновлен`);
          results.push({ lessonNumber: lesson.lesson_number, success: true });
        }
      } catch (error) {
        console.error(`❌ Ошибка при генерации урока ${lesson.lesson_number}:`, error);
        results.push({ lessonNumber: lesson.lesson_number, success: false });
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`\n🎉 Обновление завершено! Успешно: ${successCount}/${lessons.length}`);

    if (successCount < lessons.length) {
      console.log("❌ Неудачные уроки:");
      results.filter(r => !r.success).forEach(r => {
        console.log(`  - Урок ${r.lessonNumber}`);
      });
    }

  } catch (error) {
    console.error("❌ Критическая ошибка:", error);
  }
}

/**
 * Создает базовую персонализацию на основе анкеты
 */
function createBasicPersonalization(
  surveyData: any,
  lesson: { lesson_number: number; title: string },
  userName: string
): Record<string, unknown> {
  const motivation = surveyData.motivation?.join(", ") || "изучение массажа";
  const targetClients = surveyData.target_clients || "различные клиенты";
  const skillsWanted = surveyData.skills_wanted || "техники массажа";
  const fears = surveyData.fears?.join(", ") || "не указаны";
  const wowResult = surveyData.wow_result || "улучшение навыков";
  const practiceModel = surveyData.practice_model || "семья и друзья";

  return {
    summary_short: `Привет, ${userName}! Этот урок поможет вам освоить важные техники массажа.`,
    prev_lessons: lesson.lesson_number === 1 
      ? "Это первый урок курса" 
      : `Мы изучили основы массажа на предыдущих уроках. Ваша мотивация: ${motivation}`,
    why_watch: `Этот урок важен для ваших целей: ${wowResult}. Вы сможете применить полученные знания с ${practiceModel}.`,
    quick_action: `Просмотрите видео урока внимательно, учитывая ваши цели: ${skillsWanted}`,
    social_share: `Изучаю новые техники массажа для работы с ${targetClients}!`,
    homework_20m: `1. Просмотрите видео урока. 2. Попрактикуйтесь с ${practiceModel}. 3. Обратите внимание на ${skillsWanted}. 4. Запишите свои наблюдения.`
  };
}

// Запускаем обновление
const userId = process.argv[2] || "21179358";
updateUserPersonalizations(userId).catch(console.error);
