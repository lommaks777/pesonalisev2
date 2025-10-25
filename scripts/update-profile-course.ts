#!/usr/bin/env node
/**
 * Update profile with course_id
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function updateProfile(userId: string) {
  console.log(`🔄 Обновляем профиль пользователя ${userId}...\n`);

  // 1. Get course_id for kinesio2
  const { data: course } = await supabase
    .from('courses')
    .select('id, slug')
    .eq('slug', 'kinesio2')
    .single();

  if (!course) {
    console.error('❌ Курс kinesio2 не найден');
    process.exit(1);
  }

  console.log(`✅ Найден курс: ${course.slug}`);
  console.log(`   Course ID: ${course.id}\n`);

  // 2. Update profile with course_id
  const { data: updatedProfile, error } = await supabase
    .from('profiles')
    .update({ course_id: course.id })
    .eq('user_identifier', userId)
    .select()
    .single();

  if (error) {
    console.error('❌ Ошибка обновления профиля:', error);
    process.exit(1);
  }

  console.log('✅ Профиль обновлён!');
  console.log(`   Profile ID: ${updatedProfile.id}`);
  console.log(`   User: ${updatedProfile.name}`);
  console.log(`   Course ID: ${updatedProfile.course_id}`);
  console.log(`   Course Slug: ${updatedProfile.course_slug}\n`);
  console.log('✨ Теперь персонализация должна работать!');
}

const userId = process.argv[2];

if (!userId) {
  console.error('❌ Укажите ID пользователя:');
  console.error('   npx tsx --env-file=.env.local scripts/update-profile-course.ts <userId>');
  process.exit(1);
}

updateProfile(userId);
