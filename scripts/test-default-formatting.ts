#!/usr/bin/env tsx
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { formatDefaultTemplateContent } from '../lib/services/html-formatter';

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const courseSlug = 'taping-basics';
  const lessonNum = 1;

  const { data: courses } = await (supabase
    .from('courses')
    .select('id, slug, title')
    .eq('slug', courseSlug) as any);

  if (!courses || courses.length === 0) {
    console.log(`❌ Course "${courseSlug}" not found`);
    return;
  }

  const course = courses[0];

  const { data: lessons } = await (supabase
    .from('lessons')
    .select('lesson_number, title, default_description')
    .eq('course_id', course.id)
    .eq('lesson_number', lessonNum) as any);

  if (!lessons || lessons.length === 0) {
    console.log(`❌ Lesson ${lessonNum} not found`);
    return;
  }

  const lesson = lessons[0];
  
  console.log(`📚 Course: ${course.title}`);
  console.log(`📖 Lesson: ${lesson.lesson_number} - ${lesson.title}\n`);
  
  if (!lesson.default_description) {
    console.log('❌ No default_description');
    return;
  }

  console.log('Testing formatDefaultTemplateContent...\n');
  
  const html = formatDefaultTemplateContent(
    lesson.default_description,
    {
      lesson_number: lesson.lesson_number,
      title: lesson.title,
    },
    true
  );

  console.log('='.repeat(70));
  console.log('GENERATED HTML');
  console.log('='.repeat(70));
  console.log(html);
  console.log('\n✅ HTML generated successfully!');
}

main();
