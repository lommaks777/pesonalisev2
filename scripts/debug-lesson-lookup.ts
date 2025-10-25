#!/usr/bin/env node
/**
 * Debug lesson lookup issue
 * Check what lesson is found for lesson=2 with different course slugs
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function debugLessonLookup() {
  console.log('🔍 Debugging lesson lookup for lesson number 2\n');

  // 1. Get course IDs
  const { data: courses } = await supabase
    .from('courses')
    .select('id, slug, title')
    .in('slug', ['shvz', 'massazh-shvz', 'kinesio2']);

  console.log('📚 Courses:');
  courses?.forEach(c => {
    console.log(`   - ${c.slug} (${c.title}): ${c.id}`);
  });
  console.log();

  // 2. Find all lessons with number 2
  const { data: allLesson2 } = await supabase
    .from('lessons')
    .select('id, lesson_number, title, course_id')
    .eq('lesson_number', 2)
    .order('created_at', { ascending: true });

  console.log('📖 All lessons with lesson_number = 2:');
  allLesson2?.forEach((l, i) => {
    const course = courses?.find(c => c.id === l.course_id);
    console.log(`   ${i + 1}. "${l.title}"`);
    console.log(`      Course: ${course?.slug || 'unknown'} (${course?.title || 'unknown'})`);
    console.log(`      Lesson ID: ${l.id}`);
    console.log(`      Course ID: ${l.course_id}\n`);
  });

  // 3. Simulate API lookup WITHOUT course filter (current bug)
  console.log('❌ Current API behavior (WITHOUT course filter):');
  const { data: wrongLesson } = await supabase
    .from('lessons')
    .select('id, lesson_number, title, course_id')
    .eq('lesson_number', 2)
    .limit(1)
    .single();

  if (wrongLesson) {
    const wrongCourse = courses?.find(c => c.id === wrongLesson.course_id);
    console.log(`   Found: "${wrongLesson.title}"`);
    console.log(`   From course: ${wrongCourse?.slug} ❌ (может быть не тот!)\n`);
  }

  // 4. Simulate CORRECT lookup WITH course filter
  for (const testCourse of ['shvz', 'massazh-shvz', 'kinesio2']) {
    const course = courses?.find(c => c.slug === testCourse);
    if (!course) continue;

    const { data: correctLesson } = await supabase
      .from('lessons')
      .select('id, lesson_number, title, course_id')
      .eq('course_id', course.id)
      .eq('lesson_number', 2)
      .limit(1)
      .maybeSingle();

    console.log(`✅ Correct lookup for course="${testCourse}":`);
    if (correctLesson) {
      console.log(`   Found: "${correctLesson.title}"`);
      console.log(`   Lesson ID: ${correctLesson.id}\n`);
    } else {
      console.log(`   Not found\n`);
    }
  }

  // 5. Check user profile
  console.log('👤 Checking user 21179358 profile:');
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, user_identifier, course_slug, name')
    .eq('user_identifier', '21179358')
    .maybeSingle();

  if (profile) {
    console.log(`   User: ${profile.name}`);
    console.log(`   Course: ${profile.course_slug}`);
    console.log(`   ⚠️  Profile exists but might be for wrong course!\n`);
  } else {
    console.log(`   ❌ Profile not found in database\n`);
  }
}

debugLessonLookup();
