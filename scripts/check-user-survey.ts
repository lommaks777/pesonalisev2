#!/usr/bin/env tsx
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const userId = process.argv[2] || '21179358';
  
  console.log('🔍 Checking user:', userId);
  console.log('='.repeat(70));

  // 1. Проверяем профиль
  const { data: profile } = await (supabase
    .from('profiles')
    .select('*')
    .eq('user_identifier', userId)
    .maybeSingle() as any);

  if (!profile) {
    console.log('❌ Profile not found for user:', userId);
    return;
  }

  console.log('✅ Profile found:');
  console.log('   ID:', profile.id);
  console.log('   Name:', profile.name || 'N/A');
  console.log('   Course Slug:', profile.course_slug || 'N/A');
  console.log('   Created:', profile.created_at);
  console.log('');

  // 2. Проверяем survey data
  console.log('📋 Survey Data:');
  if (profile.survey_data) {
    console.log('   ✅ Survey completed');
    console.log('   Data:', JSON.stringify(profile.survey_data, null, 4));
  } else if (profile.survey) {
    console.log('   ✅ Survey completed (old format)');
    console.log('   Data:', JSON.stringify(profile.survey, null, 4));
  } else {
    console.log('   ❌ No survey data found');
  }
  console.log('');

  // 3. Проверяем персонализации
  const { data: personalizations, count } = await (supabase
    .from('personalizations')
    .select('lesson_id, created_at', { count: 'exact' })
    .eq('profile_id', profile.id) as any);

  console.log('🎨 Personalizations:');
  console.log('   Total count:', count || 0);
  
  if (personalizations && personalizations.length > 0) {
    console.log('   Lessons with personalization:');
    for (const p of personalizations.slice(0, 10)) {
      const { data: lesson } = await (supabase
        .from('lessons')
        .select('lesson_number, title')
        .eq('id', p.lesson_id)
        .single() as any);
      
      if (lesson) {
        console.log(`      - Lesson ${lesson.lesson_number}: ${lesson.title}`);
      }
    }
    if (personalizations.length > 10) {
      console.log(`      ... and ${personalizations.length - 10} more`);
    }
  } else {
    console.log('   ❌ No personalizations found');
  }
}

main();
