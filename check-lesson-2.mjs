import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Переменные окружения не загружены!');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'загружен' : 'отсутствует');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', serviceRoleKey ? 'загружен' : 'отсутствует');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkLesson2() {
  console.log('🔍 Проверка урока 2 курса massazh-shvz...\n');
  
  // 1. Найти курс
  const { data: course } = await supabase
    .from('courses')
    .select('id, slug, title')
    .eq('slug', 'massazh-shvz')
    .maybeSingle();
  
  if (!course) {
    console.log('❌ Курс massazh-shvz не найден!');
    return;
  }
  
  console.log('✅ Курс найден:', course);
  console.log('');
  
  // 2. Найти урок 2
  const { data: lesson } = await supabase
    .from('lessons')
    .select('id, lesson_number, title, course_id, content')
    .eq('course_id', course.id)
    .eq('lesson_number', 2)
    .maybeSingle();
  
  if (!lesson) {
    console.log('❌ Урок 2 не найден!');
    return;
  }
  
  console.log('✅ Урок найден:', {
    id: lesson.id,
    number: lesson.lesson_number,
    title: lesson.title,
    course_id: lesson.course_id
  });
  console.log('');
  
  // 3. Проверить content.template
  if (lesson.content?.template) {
    console.log('✅ Шаблон найден в БД');
    console.log('Ключи шаблона:', Object.keys(lesson.content.template));
    console.log('');
    console.log('📄 Полный шаблон:');
    console.log(JSON.stringify(lesson.content.template, null, 2));
  } else {
    console.log('⚠️ Шаблон отсутствует в content.template');
    console.log('Content:', lesson.content);
  }
  
  // 4. Проверить, есть ли слово "тейп" в шаблоне
  const templateStr = JSON.stringify(lesson.content);
  if (templateStr.toLowerCase().includes('тейп')) {
    console.log('\n⚠️⚠️⚠️ ВНИМАНИЕ: В шаблоне найдено слово "тейп"!');
    const matches = templateStr.match(/тейп[а-я]*/gi);
    console.log('Найденные вхождения:', [...new Set(matches)]);
  } else {
    console.log('\n✅ Слово "тейп" в шаблоне НЕ найдено');
  }
}

checkLesson2().catch(console.error);
