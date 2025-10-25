#!/usr/bin/env node
/**
 * Debug script to check profile and personalization data
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function checkProfile(userId: string) {
  console.log(`🔍 Проверяем данные для пользователя ${userId}...\n`);

  // 1. Check profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_identifier', userId)
    .single();

  if (profileError) {
    console.error('❌ Ошибка загрузки профиля:', profileError);
    return;
  }

  console.log('✅ Профиль:');
  console.log(`   ID: ${profile.id}`);
  console.log(`   Имя: ${profile.name}`);
  console.log(`   User Identifier: ${profile.user_identifier}`);
  console.log(`   Course Slug: ${profile.course_slug}`);
  console.log(`   Course ID: ${profile.course_id || 'не указан'}`);
  console.log(`   Создан: ${profile.created_at}\n`);

  // 2. Check personalizations count
  const { data: personalizations, error: persError } = await supabase
    .from('personalized_lesson_descriptions')
    .select('id, lesson_id, created_at')
    .eq('profile_id', profile.id);

  if (persError) {
    console.error('❌ Ошибка загрузки персонализаций:', persError);
    return;
  }

  console.log(`✅ Персонализации: ${personalizations?.length || 0} шт.\n`);

  if (personalizations && personalizations.length > 0) {
    console.log('📋 Первые 5 персонализаций:');
    personalizations.slice(0, 5).forEach((p, i) => {
      console.log(`   ${i + 1}. Lesson ID: ${p.lesson_id} - ${p.created_at}`);
    });
    console.log();
  }

  // 3. Check specific lesson (lesson 1)
  console.log('🔍 Проверяем урок 1...\n');
  
  // Try to find lesson by number 1 in kinesio2 course
  const { data: course } = await supabase
    .from('courses')
    .select('id, slug, title')
    .eq('slug', 'kinesio2')
    .single();

  if (!course) {
    console.error('❌ Курс kinesio2 не найден');
    return;
  }

  console.log(`✅ Курс: ${course.title} (${course.slug})`);
  console.log(`   Course ID: ${course.id}\n`);

  const { data: lesson } = await supabase
    .from('lessons')
    .select('id, title, lesson_number, course_id')
    .eq('course_id', course.id)
    .eq('lesson_number', 1)
    .single();

  if (!lesson) {
    console.error('❌ Урок 1 не найден для курса kinesio2');
    return;
  }

  console.log(`✅ Урок 1: ${lesson.title}`);
  console.log(`   Lesson ID: ${lesson.id}`);
  console.log(`   Course ID: ${lesson.course_id}\n`);

  // 4. Check if personalization exists for this lesson
  const { data: specificPers } = await supabase
    .from('personalized_lesson_descriptions')
    .select('*')
    .eq('profile_id', profile.id)
    .eq('lesson_id', lesson.id)
    .single();

  if (specificPers) {
    console.log('✅ Персонализация для урока 1 найдена!');
    console.log(`   Создана: ${specificPers.created_at}`);
    console.log(`   Содержит ключи:`, Object.keys(specificPers.content as any).join(', '));
  } else {
    console.log('❌ Персонализация для урока 1 НЕ НАЙДЕНА');
  }

  // 5. Check if profile needs course_id update
  if (!profile.course_id) {
    console.log(`\n⚠️  ВНИМАНИЕ: Профиль не содержит course_id!`);
    console.log(`   Обновите profile.course_id = ${course.id}`);
    console.log(`   Выполните: UPDATE profiles SET course_id = '${course.id}' WHERE id = '${profile.id}';`);
  }
}

const userId = process.argv[2];

if (!userId) {
  console.error('❌ Укажите ID пользователя:');
  console.error('   npx tsx --env-file=.env.local scripts/check-profile-debug.ts <userId>');
  process.exit(1);
}

checkProfile(userId);
