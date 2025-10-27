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

async function checkLessonDetails() {
  console.log('🔍 Detailed check of taping-basics lesson 1...\n');

  // Get course
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('*')
    .eq('slug', 'taping-basics')
    .single();

  if (courseError || !course) {
    console.error('❌ Course error:', courseError);
    return;
  }

  console.log('📚 Course:', course.title);
  console.log('   ID:', course.id);
  console.log('   Slug:', course.slug);

  // Get lesson 1 with ALL fields
  const { data: lesson, error: lessonError } = await supabase
    .from('lessons')
    .select('*')
    .eq('course_id', course.id)
    .eq('lesson_number', 1)
    .single();

  if (lessonError || !lesson) {
    console.error('❌ Lesson error:', lessonError);
    return;
  }

  console.log('\n📝 Lesson 1:');
  console.log('   ID:', lesson.id);
  console.log('   Title:', lesson.title);
  console.log('   Lesson Number:', lesson.lesson_number);
  console.log('   Course ID:', lesson.course_id);
  
  console.log('\n📊 Content Fields:');
  console.log('   transcription (direct field):', lesson.transcription ? 
    `EXISTS (${lesson.transcription.length} chars)` : 
    '❌ NULL or MISSING');
  
  console.log('   default_description:', lesson.default_description ? 
    'EXISTS' : 
    '❌ NULL or MISSING');
  
  console.log('   content (JSON field):', lesson.content ? 
    'EXISTS' : 
    '❌ NULL or MISSING');
  
  // Check what's in content JSON field
  if (lesson.content) {
    console.log('\n🔍 Content JSON structure:');
    const content = lesson.content as any;
    console.log('   Keys:', Object.keys(content).join(', '));
    
    if (content.transcription) {
      console.log('   ⚠️  content.transcription:', `EXISTS (${content.transcription.length} chars)`);
    }
    
    if (content.template) {
      console.log('   content.template:', 'EXISTS');
    }
  }
  
  // Check default_description structure
  if (lesson.default_description) {
    console.log('\n📋 Default Description structure:');
    const defaultDesc = lesson.default_description as any;
    console.log('   Type:', typeof defaultDesc);
    console.log('   Keys:', Object.keys(defaultDesc).join(', '));
  }

  // Show first 200 chars of transcription if exists
  if (lesson.transcription) {
    console.log('\n📄 Transcription preview (first 200 chars):');
    console.log('   "' + lesson.transcription.substring(0, 200) + '..."');
  } else if (lesson.content && (lesson.content as any).transcription) {
    console.log('\n⚠️  Transcription is in content JSON field, not direct field!');
    console.log('   Preview:', (lesson.content as any).transcription.substring(0, 200) + '...');
  }
  
  // Check kinescope IDs
  console.log('\n🎥 Kinescope Info:');
  console.log('   kinescope_play_link_id:', lesson.kinescope_play_link_id || '❌ NULL');
  console.log('   kinescope_video_content_id:', lesson.kinescope_video_content_id || '❌ NULL');
}

checkLessonDetails()
  .then(() => {
    console.log('\n✅ Check complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
