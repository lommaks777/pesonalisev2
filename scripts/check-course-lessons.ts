import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCourseLessons() {
  console.log('🔍 Checking courses and lessons...\n');

  // Get all courses
  const { data: courses, error: coursesError } = await supabase
    .from('courses')
    .select('*')
    .order('created_at');

  if (coursesError) {
    console.error('Error fetching courses:', coursesError);
    return;
  }

  console.log(`Found ${courses?.length || 0} courses:\n`);

  for (const course of courses || []) {
    console.log(`📚 Course: ${course.title} (slug: ${course.slug})`);
    console.log(`   ID: ${course.id}`);

    // Get lessons for this course
    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('*')
      .eq('course_id', course.id)
      .order('lesson_number');

    if (lessonsError) {
      console.error(`   Error fetching lessons:`, lessonsError);
      continue;
    }

    if (!lessons || lessons.length === 0) {
      console.log(`   ⚠️  No lessons found for this course\n`);
      continue;
    }

    console.log(`   ✅ ${lessons.length} lessons found:`);
    for (const lesson of lessons) {
      const lessonTyped = lesson as any;
      const hasTranscript = lessonTyped.content?.transcription ? '✓' : '✗';
      const hasTemplate = lessonTyped.content?.template ? '✓' : '✗';
      console.log(`      ${lessonTyped.lesson_number}. ${lessonTyped.title}`);
      console.log(`         - Transcript: ${hasTranscript}, Template: ${hasTemplate}`);
    }
    console.log('');
  }

  // Check for lessons without course_id
  const { data: orphanLessons } = await supabase
    .from('lessons')
    .select('*')
    .is('course_id', null);

  if (orphanLessons && orphanLessons.length > 0) {
    console.log(`\n⚠️  Found ${orphanLessons.length} lessons without course_id:`);
    for (const lesson of orphanLessons) {
      console.log(`   - ${lesson.title} (lesson_number: ${lesson.lesson_number})`);
    }
  }
}

checkCourseLessons()
  .then(() => {
    console.log('\n✅ Check complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
