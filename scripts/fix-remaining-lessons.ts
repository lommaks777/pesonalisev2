import "dotenv/config";
import { createClient } from '@supabase/supabase-js';

// Конфигурация Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL не задан');
  process.exit(1);
}

// Используем anon key если service key не доступен
const supabaseKey = supabaseServiceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY или NEXT_PUBLIC_SUPABASE_ANON_KEY не задан');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixRemainingLessons() {
  console.log('🔄 Исправляем оставшиеся уроки...');

  try {
    // Маппинг названий уроков из базы данных на правильные номера
    const lessonMappings = [
      { title: "1 Урок Демонстрация", newNumber: 5 },
      { title: "1 Урок введение.", newNumber: 1 },
      { title: "1 урок повторяйте за мной", newNumber: 6 }
    ];

    for (const mapping of lessonMappings) {
      console.log(`📝 Обновляем "${mapping.title}": → ${mapping.newNumber}`);
      
      const { error: updateError } = await supabase
        .from('lessons')
        .update({ lesson_number: mapping.newNumber })
        .eq('title', mapping.title);

      if (updateError) {
        console.error(`❌ Ошибка при обновлении "${mapping.title}":`, updateError.message);
      } else {
        console.log(`✅ Урок "${mapping.title}" успешно обновлен: → ${mapping.newNumber}`);
      }
    }

    console.log('🎉 Исправление оставшихся уроков завершено!');

    // Проверяем финальный результат
    console.log('\n📚 Финальные номера уроков:');
    const { data: lessons, error: fetchError } = await supabase
      .from('lessons')
      .select('lesson_number, title')
      .order('lesson_number', { ascending: true });

    if (fetchError) {
      console.error('❌ Ошибка при получении уроков:', fetchError.message);
      return;
    }

    lessons?.forEach(lesson => {
      console.log(`${lesson.lesson_number}: ${lesson.title}`);
    });

  } catch (error) {
    console.error('❌ Критическая ошибка:', error);
  }
}

// Запускаем исправление
fixRemainingLessons().catch(console.error);
