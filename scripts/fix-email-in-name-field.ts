/**
 * Исправляет профили где в поле name записан email
 * Берёт правильное имя из survey.real_name
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function main() {
  console.log('🔧 ИСПРАВЛЕНИЕ EMAIL В ПОЛЕ NAME\n');
  
  // Получаем все профили
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, user_identifier, name, course_slug, survey');

  if (error) {
    console.error('❌ Ошибка загрузки профилей:', error);
    return;
  }

  if (!profiles || profiles.length === 0) {
    console.log('⚠️  Профили не найдены');
    return;
  }

  console.log(`📊 Всего профилей: ${profiles.length}\n`);

  let fixed = 0;
  let skipped = 0;
  let errors = 0;

  for (const profile of profiles) {
    const survey = profile.survey as any;
    
    // Проверяем: есть ли email в поле name
    if (profile.name && profile.name.includes('@')) {
      const realName = survey?.real_name;
      
      if (realName && realName !== profile.name) {
        console.log(`\n🔄 Исправляем профиль: ${profile.id}`);
        console.log(`   User: ${profile.user_identifier}`);
        console.log(`   Course: ${profile.course_slug}`);
        console.log(`   Было: "${profile.name}"`);
        console.log(`   Станет: "${realName}"`);
        
        // Обновляем
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ name: realName })
          .eq('id', profile.id);

        if (updateError) {
          console.log(`   ❌ Ошибка: ${updateError.message}`);
          errors++;
        } else {
          console.log(`   ✅ Исправлено`);
          fixed++;
        }
      } else {
        console.log(`\n⚠️  Пропускаем профиль: ${profile.id}`);
        console.log(`   Причина: survey.real_name отсутствует или совпадает с email`);
        skipped++;
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n📊 ИТОГИ:\n');
  console.log(`✅ Исправлено: ${fixed}`);
  console.log(`⏭️  Пропущено: ${skipped}`);
  console.log(`❌ Ошибок: ${errors}`);
  console.log('');
}

main().catch(console.error);
