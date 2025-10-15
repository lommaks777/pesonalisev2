import "dotenv/config";
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

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

async function updateLessonNumbers() {
  console.log('🔄 Начинаем безопасное обновление номеров уроков...');

  try {
    // Получаем все уроки из базы данных
    const { data: lessons, error: fetchError } = await supabase
      .from('lessons')
      .select('id, lesson_number, title')
      .order('lesson_number', { ascending: true });

    if (fetchError) {
      console.error('❌ Ошибка при получении уроков:', fetchError.message);
      return;
    }

    console.log(`📚 Найдено ${lessons?.length || 0} уроков в базе данных`);

    // Сначала устанавливаем все номера в временные значения (начиная с 1000)
    console.log('🔄 Шаг 1: Устанавливаем временные номера...');
    for (let i = 0; i < lessons.length; i++) {
      const lesson = lessons[i];
      const tempNumber = 1000 + i;
      
      console.log(`📝 Временный номер для "${lesson.title}": ${lesson.lesson_number} → ${tempNumber}`);
      
      const { error: updateError } = await supabase
        .from('lessons')
        .update({ lesson_number: tempNumber })
        .eq('id', lesson.id);

      if (updateError) {
        console.error(`❌ Ошибка при установке временного номера для "${lesson.title}":`, updateError.message);
        return;
      }
    }

    console.log('✅ Временные номера установлены');

    // Теперь обновляем на правильные номера
    console.log('🔄 Шаг 2: Устанавливаем правильные номера...');
    for (const lesson of lessons || []) {
      // Находим соответствующий файл урока
      const lessonDir = path.join(process.cwd(), 'store', 'shvz', 'lessons');
      const lessonFiles = fs.readdirSync(lessonDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name)
        .sort();

      let newNumber: number | null = null;

      // Ищем файл урока по содержимому
      for (const dir of lessonFiles) {
        const lessonPath = path.join(lessonDir, dir, 'lesson.json');
        if (fs.existsSync(lessonPath)) {
          try {
            const lessonData = JSON.parse(fs.readFileSync(lessonPath, 'utf8'));
            if (lessonData.title === lesson.title) {
              newNumber = lessonData.number;
              break;
            }
          } catch (error) {
            console.warn(`⚠️ Ошибка при чтении файла ${lessonPath}:`, error);
          }
        }
      }

      if (newNumber) {
        console.log(`📝 Устанавливаем правильный номер для "${lesson.title}": ${newNumber}`);
        
        const { error: updateError } = await supabase
          .from('lessons')
          .update({ lesson_number: newNumber })
          .eq('id', lesson.id);

        if (updateError) {
          console.error(`❌ Ошибка при обновлении урока "${lesson.title}":`, updateError.message);
        } else {
          console.log(`✅ Урок "${lesson.title}" успешно обновлен: → ${newNumber}`);
        }
      } else {
        console.warn(`⚠️ Не найден файл для урока "${lesson.title}"`);
      }
    }

    console.log('🎉 Безопасное обновление номеров уроков завершено!');

  } catch (error) {
    console.error('❌ Критическая ошибка:', error);
  }
}

// Запускаем обновление
updateLessonNumbers().catch(console.error);
