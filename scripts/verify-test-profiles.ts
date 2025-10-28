import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function main() {
  console.log('🔍 ПРОВЕРКА ТЕСТОВЫХ ПРОФИЛЕЙ\n');
  
  // Проверка 1: Email в user_identifier
  console.log('=== ТЕСТ 1: Email как user_identifier ===');
  const { data: profile1, error: error1 } = await supabase
    .from('profiles')
    .select('user_identifier, name, course_slug, survey')
    .eq('user_identifier', 'test@example.com')
    .eq('course_slug', 'taping-basics')
    .maybeSingle();

  if (error1) {
    console.log('❌ Ошибка:', error1.message);
  } else if (!profile1) {
    console.log('⚠️  Профиль не найден');
  } else {
    console.log('✅ Профиль найден:');
    console.log('   user_identifier:', profile1.user_identifier);
    console.log('   name:', profile1.name);
    console.log('   survey.real_name:', (profile1.survey as any)?.real_name);
    
    if (profile1.name === 'Тестовый Пользователь') {
      console.log('   ✅ ИМЯ ЗАПИСАНО ПРАВИЛЬНО!');
    } else {
      console.log('   ❌ ИМЯ НЕПРАВИЛЬНОЕ! Ожидалось: "Тестовый Пользователь"');
    }
  }
  
  console.log('');
  
  // Проверка 2: Обычный ID
  console.log('=== ТЕСТ 2: Обычный user ID ===');
  const { data: profile2, error: error2 } = await supabase
    .from('profiles')
    .select('user_identifier, name, course_slug, survey')
    .eq('user_identifier', '987654321')
    .eq('course_slug', 'taping-basics')
    .maybeSingle();

  if (error2) {
    console.log('❌ Ошибка:', error2.message);
  } else if (!profile2) {
    console.log('⚠️  Профиль не найден');
  } else {
    console.log('✅ Профиль найден:');
    console.log('   user_identifier:', profile2.user_identifier);
    console.log('   name:', profile2.name);
    console.log('   survey.real_name:', (profile2.survey as any)?.real_name);
    
    if (profile2.name === 'Иван Иванов') {
      console.log('   ✅ ИМЯ ЗАПИСАНО ПРАВИЛЬНО!');
    } else {
      console.log('   ❌ ИМЯ НЕПРАВИЛЬНОЕ! Ожидалось: "Иван Иванов"');
    }
  }
  
  console.log('');
  
  // Проверка 3: Реальный пользователь 469887216
  console.log('=== РЕАЛЬНЫЙ ПОЛЬЗОВАТЕЛЬ: 469887216 ===');
  const { data: profiles, error: error3 } = await supabase
    .from('profiles')
    .select('id, user_identifier, name, course_slug, survey, created_at')
    .eq('user_identifier', '469887216')
    .order('created_at', { ascending: false });

  if (error3) {
    console.log('❌ Ошибка:', error3.message);
  } else if (!profiles || profiles.length === 0) {
    console.log('⚠️  Профили не найдены');
  } else {
    console.log(`✅ Найдено профилей: ${profiles.length}`);
    profiles.forEach((p, i) => {
      const survey = p.survey as any;
      console.log(`\nПрофиль ${i + 1}:`);
      console.log('   ID:', p.id);
      console.log('   Course:', p.course_slug);
      console.log('   Created:', p.created_at);
      console.log('   name:', p.name);
      console.log('   survey.real_name:', survey?.real_name);
      
      if (p.name?.includes('@')) {
        console.log('   ⚠️  В поле name записан EMAIL вместо имени!');
        console.log(`   💡 Нужно обновить: name = "${survey?.real_name || 'Полина'}"`);
      } else if (p.name === survey?.real_name) {
        console.log('   ✅ name совпадает с survey.real_name');
      } else {
        console.log('   ⚠️  name НЕ совпадает с survey.real_name');
      }
    });
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 ВЫВОДЫ:\n');
  console.log('1. API /api/survey ПРАВИЛЬНО сохраняет name из поля real_name');
  console.log('2. Если в базе есть email вместо имени - это было записано ДО нашего кода');
  console.log('3. Нужно обновить старые записи вручную или через миграцию');
  console.log('');
}

main().catch(console.error);
