#!/usr/bin/env tsx
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const courseSlug = process.argv[2] || 'taping-basics';
  const lessonNum = parseInt(process.argv[3] || '1');

  const { data: courses } = await (supabase
    .from('courses')
    .select('id, slug, title')
    .eq('slug', courseSlug) as any);

  if (!courses || courses.length === 0) {
    console.log(`❌ Course "${courseSlug}" not found`);
    return;
  }

  const course = courses[0];
  console.log(`📚 Course: ${course.title} (${course.slug})\n`);

  const { data: lessons } = await (supabase
    .from('lessons')
    .select('lesson_number, title, default_description')
    .eq('course_id', course.id)
    .eq('lesson_number', lessonNum) as any);

  if (!lessons || lessons.length === 0) {
    console.log(`❌ Lesson ${lessonNum} not found in course "${courseSlug}"`);
    return;
  }

  const lesson = lessons[0];
  console.log(`📖 Урок ${lesson.lesson_number}: ${lesson.title}\n`);
  
  if (!lesson.default_description) {
    console.log('❌ No default_description available');
    return;
  }

  console.log('='.repeat(70));
  console.log('DEFAULT DESCRIPTION');
  console.log('='.repeat(70));
  console.log(JSON.stringify(lesson.default_description, null, 2));
}

main();
