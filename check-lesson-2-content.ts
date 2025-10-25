import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function check() {
  // 1. Найти курс
  const { data: course } = await supabase
    .from('courses')
    .select('id, slug, title')
    .eq('slug', 'massazh-shvz')
    .single();
  
  console.log('📚 Курс:', course);
  console.log('');
  
  // 2. Получить все уроки курса
  const { data: lessons } = await supabase
    .from('lessons')
    .select('id, lesson_number, title, content')
    .eq('course_id', course!.id)
    .order('lesson_number');
  
  console.log('📖 Все уроки курса:');
  lessons?.forEach(l => {
    console.log(`  ${l.lesson_number}. ${l.title}`);
  });
  console.log('');
  
  // 3. Проверить урок 2
  const lesson2 = lessons?.find(l => l.lesson_number === 2);
  if (lesson2) {
    console.log('🔍 Урок 2:');
    console.log('  ID:', lesson2.id);
    console.log('  Номер:', lesson2.lesson_number);
    console.log('  Название:', lesson2.title);
    console.log('');
    
    if (lesson2.content?.template) {
      const template = lesson2.content.template;
      console.log('📄 Шаблон урока 2:');
      console.log('  Введение:', template['👋 Введение'] || template.introduction);
      console.log('');
      console.log('  Полный шаблон:');
      console.log(JSON.stringify(template, null, 2));
    } else {
      console.log('⚠️ Шаблон отсутствует!');
    }
  }
}

check().catch(console.error);
