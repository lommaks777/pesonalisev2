/**
 * Check what data is currently stored in the database for each lesson
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY должны быть заданы');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false }
});

async function checkLessonData() {
  console.log('📊 Checking lesson data in database...\n');

  // Get all lessons with course info
  const { data: lessons, error } = await supabase
    .from('lessons')
    .select(`
      id,
      lesson_number,
      title,
      summary,
      content,
      courses (
        slug,
        title
      )
    `)
    .order('lesson_number');

  if (error) {
    console.error('❌ Error fetching lessons:', error);
    return;
  }

  if (!lessons || lessons.length === 0) {
    console.log('⚠️ No lessons found in database');
    return;
  }

  console.log(`✅ Found ${lessons.length} lessons\n`);
  console.log('═'.repeat(100));

  lessons.forEach((lesson: any) => {
    console.log(`\n📖 Lesson ${lesson.lesson_number}: ${lesson.title}`);
    console.log(`   ID: ${lesson.id}`);
    console.log(`   Course: ${lesson.courses?.slug} (${lesson.courses?.title})`);
    console.log(`   Summary: ${lesson.summary ? '✓ Present' : '✗ Missing'}`);
    
    if (lesson.content) {
      const content = lesson.content as any;
      console.log(`   Content JSONB:`);
      console.log(`      - transcription: ${content.transcription ? `✓ (${content.transcription.length} chars)` : '✗ Missing'}`);
      console.log(`      - kinescope_play_id: ${content.kinescope_play_id || '✗ Missing'}`);
      console.log(`      - kinescope_video_id: ${content.kinescope_video_id || '✗ Missing'}`);
      console.log(`      - template: ${content.template ? '✓ Present' : '✗ Missing'}`);
      
      // Show all keys in content
      const keys = Object.keys(content);
      console.log(`      - Other keys: ${keys.filter(k => !['transcription', 'kinescope_play_id', 'kinescope_video_id', 'template'].includes(k)).join(', ') || 'none'}`);
    } else {
      console.log(`   Content: ✗ NULL`);
    }
  });

  console.log('\n' + '═'.repeat(100));
  console.log('\n📋 Summary:');
  
  const withTranscript = lessons.filter((l: any) => l.content?.transcription).length;
  const withKinescopePlay = lessons.filter((l: any) => l.content?.kinescope_play_id).length;
  const withKinescopeVideo = lessons.filter((l: any) => l.content?.kinescope_video_id).length;
  const withTemplate = lessons.filter((l: any) => l.content?.template).length;
  
  console.log(`   Total lessons: ${lessons.length}`);
  console.log(`   With transcription: ${withTranscript}/${lessons.length}`);
  console.log(`   With kinescope_play_id: ${withKinescopePlay}/${lessons.length}`);
  console.log(`   With kinescope_video_id: ${withKinescopeVideo}/${lessons.length}`);
  console.log(`   With template: ${withTemplate}/${lessons.length}`);
  console.log('');
}

checkLessonData().catch(console.error);
