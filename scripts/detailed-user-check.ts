import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function checkUser(userId: string) {
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_identifier', userId)
    .order('created_at', { ascending: false });

  if (!profiles || profiles.length === 0) {
    console.log(`❌ Профили для user ${userId} не найдены`);
    return;
  }

  console.log(`\n👤 Пользователь: ${userId}`);
  console.log(`Профилей найдено: ${profiles.length}\n`);

  profiles.forEach((p, i) => {
    const survey = p.survey as any;
    console.log(`\n📋 Профиль ${i + 1}:`);
    console.log('   ID:', p.id);
    console.log('   Курс:', p.course_slug);
    console.log('   Создан:', p.created_at);
    console.log('   name:', JSON.stringify(p.name));
    console.log('   survey.real_name:', JSON.stringify(survey?.real_name));
    console.log('   survey.uid:', JSON.stringify(survey?.uid));
    
    // Проверки
    if (!p.name) {
      console.log('   ⚠️  name = NULL!');
    } else if (p.name.includes('@')) {
      console.log('   ❌ name содержит EMAIL!');
    } else {
      console.log('   ✅ name выглядит нормально');
    }
    
    if (survey?.real_name && p.name !== survey.real_name) {
      console.log(`   💡 Рекомендуется обновить: name = "${survey.real_name}"`);
    }
  });
}

async function main() {
  console.log('🔍 ДЕТАЛЬНАЯ ПРОВЕРКА ПОЛЬЗОВАТЕЛЕЙ\n');
  console.log('='.repeat(60));
  
  await checkUser('469887216');
  
  console.log('\n' + '='.repeat(60));
  
  await checkUser('test@example.com');
  
  console.log('\n' + '='.repeat(60));
  
  await checkUser('987654321');
  
  console.log('\n');
}

main().catch(e => {
  console.error('Ошибка:', e);
  process.exit(1);
});
