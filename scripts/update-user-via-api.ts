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

    // 4. Генерируем новые персонализации через API
    const results = [];
    for (const lesson of lessons) {
      console.log(`🔄 Генерируем персонализацию для урока ${lesson.lesson_number}...`);
      
      try {
        // Используем API endpoint для генерации персонализации
        const response = await fetch('https://pesonalisev2-zxby.vercel.app/api/persona/personalize-template', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: userId,
            lesson_number: lesson.lesson_number,
            flush: true
          })
        });

        if (response.ok) {
          console.log(`✅ Урок ${lesson.lesson_number} обновлен`);
          results.push({ lessonNumber: lesson.lesson_number, success: true });
        } else {
          const errorData = await response.json();
          console.error(`❌ Ошибка при обновлении урока ${lesson.lesson_number}:`, errorData.error);
          results.push({ lessonNumber: lesson.lesson_number, success: false });
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

// Запускаем обновление
const userId = process.argv[2] || "21179358";
updateUserPersonalizations(userId).catch(console.error);
