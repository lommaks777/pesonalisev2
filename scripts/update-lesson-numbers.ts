import "dotenv/config";
import { Client } from "pg";
import fs from 'fs';
import path from 'path';

const connectionString = process.env.SUPABASE_DB_URL;

if (!connectionString) {
  console.error('❌ SUPABASE_DB_URL не задан. Получите строку подключения в Supabase → Project Settings → Database → Connection string.');
  process.exit(1);
}

// Маппинг новых номеров уроков
const lessonNumberMapping: Record<string, number> = {
  '01': 1,  // Урок введение
  '02': 2,  // ШВЗ Мышцы, с которыми мы будем работать
  '03': 3,  // Диагностика и фотографирование клиента
  '04': 4,  // Что такое триггерные точки
  '05': 5,  // 5 Урок Демонстрация
  '06': 6,  // 6 урок повторяйте за мной
  '07': 7,  // 2 урок демонстрация
  '08': 8,  // 2 Урок повторяйте за мной
  '09': 9,  // 3 урок демонстрация
  '10': 10, // 3 Урок Швз повторяйте за мной
  '11': 11, // Что такое постизометрическая релаксация
  '12': 12, // 4 урок-демонстрация
};

async function updateLessonNumbers() {
  console.log('🔄 Начинаем обновление номеров уроков...');

  const client = new Client({ connectionString });
  await client.connect();

  try {
    // Получаем все уроки из базы данных
    const result = await client.query(`
      SELECT id, lesson_number, title 
      FROM lessons 
      ORDER BY lesson_number ASC
    `);

    const lessons = result.rows;
    console.log(`📚 Найдено ${lessons.length} уроков в базе данных`);

    // Обновляем номера уроков
    for (const lesson of lessons) {
      // Находим соответствующий файл урока
      const lessonDir = path.join(process.cwd(), 'store', 'shvz', 'lessons');
      const lessonFiles = fs.readdirSync(lessonDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name)
        .sort();

      let newNumber: number | null = null;
      let lessonFile: string | null = null;

      // Ищем файл урока по содержимому
      for (const dir of lessonFiles) {
        const lessonPath = path.join(lessonDir, dir, 'lesson.json');
        if (fs.existsSync(lessonPath)) {
          try {
            const lessonData = JSON.parse(fs.readFileSync(lessonPath, 'utf8'));
            if (lessonData.title === lesson.title) {
              newNumber = lessonData.number;
              lessonFile = dir;
              break;
            }
          } catch (error) {
            console.warn(`⚠️ Ошибка при чтении файла ${lessonPath}:`, error);
          }
        }
      }

      if (newNumber && newNumber !== lesson.lesson_number) {
        console.log(`📝 Обновляем урок "${lesson.title}": ${lesson.lesson_number} → ${newNumber}`);
        
        await client.query(`
          UPDATE lessons 
          SET lesson_number = $1 
          WHERE id = $2
        `, [newNumber, lesson.id]);

        console.log(`✅ Урок "${lesson.title}" успешно обновлен: ${lesson.lesson_number} → ${newNumber}`);
      } else if (newNumber === lesson.lesson_number) {
        console.log(`✓ Урок "${lesson.title}" уже имеет правильный номер: ${lesson.lesson_number}`);
      } else {
        console.warn(`⚠️ Не найден файл для урока "${lesson.title}" (номер ${lesson.lesson_number})`);
      }
    }

    console.log('🎉 Обновление номеров уроков завершено!');

  } catch (error) {
    console.error('❌ Критическая ошибка:', error);
  } finally {
    await client.end();
  }
}

// Запускаем обновление
updateLessonNumbers().catch(console.error);
