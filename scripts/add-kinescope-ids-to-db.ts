/**
 * Add Kinescope IDs to lessons in the database based on courses_rules.md
 * 
 * For each lesson, we'll add to the content JSONB:
 * - kinescope_play_id: The short ID from the play_link (e.g., "qM9um324XRfRxWXKHDhm5c")
 * - kinescope_video_id: The UUID from kinescope-videos-list.json (needs to be looked up)
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY должны быть заданы');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false }
});

// Mapping from courses_rules.md for massazh-shvz course
const MASSAZH_SHVZ_KINESCOPE_IDS: Record<number, string> = {
  1: 'qM9um324XRfRxWXKHDhm5c',
  2: '5NRs6UHWgMX9RtHqxNGy8j',
  3: 'bFfAsG1jaLsMLykc1TRryz',
  4: 'h5bu4F6D9Cwk3jBnXzLyjJ',
  5: 'wQstL7SozLXktKfyifWvxW',
  6: '4vQwt1kaYtKs4JxjSA2qoG',
  7: '7YxuJZVmvK6mwtdbcuK8nK',
  8: 'd4G4ufDWZPLafXAiffYgAQ',
  9: 'tMhuZuiZhHnfEJzVioZCZ8',
  10: 'iWdHFmJxuMAd9qAaaS9SW6',
  11: 'e4cRfmunSSzyLMxeeQtLeC',
  12: 'f6LtSgcbNfPb9nwngrR6Vo'
};

// Mapping from courses_rules.md for taping-basics course
const TAPING_BASICS_KINESCOPE_IDS: Record<number, string> = {
  1: 'bNY6pPPffmFwo1H72oxyD9',
  2: 'ar5FqAc81wPipZa6RBLPum',
  3: '3cHqMjFJhd48NdTfaNNfiW',
  4: 'fCvDw2LGkF9hYqLpJMcoU1',
  5: 'bHiAFM4vYNHdiuJ9LrcMTd',
  6: 'uMba5Jj93NiU4t6VeXTQAp'
};

interface KinescopeVideo {
  id: string;
  play_link: string;
  [key: string]: any;
}

async function loadKinescopeVideoList(): Promise<KinescopeVideo[]> {
  const videoListPath = path.join(process.cwd(), 'kinescope-videos-list.json');
  
  if (!fs.existsSync(videoListPath)) {
    console.log('⚠️ kinescope-videos-list.json not found');
    return [];
  }

  const content = fs.readFileSync(videoListPath, 'utf-8');
  return JSON.parse(content);
}

function findVideoIdByPlayId(videos: KinescopeVideo[], playId: string): string | null {
  const video = videos.find(v => v.play_link?.includes(playId));
  return video?.id || null;
}

async function updateLessonsWithKinescopeIds() {
  console.log('🔧 Adding Kinescope IDs to lessons...\n');

  // Load Kinescope video list
  const kinescopeVideos = await loadKinescopeVideoList();
  console.log(`📹 Loaded ${kinescopeVideos.length} Kinescope videos\n`);

  // Get course ID for massazh-shvz
  const { data: shvzCourse } = await supabase
    .from('courses')
    .select('id')
    .eq('slug', 'massazh-shvz')
    .single();

  if (!shvzCourse) {
    console.error('❌ Course massazh-shvz not found');
    return;
  }

  // Get course ID for taping-basics
  const { data: tapingCourse } = await supabase
    .from('courses')
    .select('id')
    .eq('slug', 'taping-basics')
    .single();

  let updated = 0;
  let failed = 0;

  // Update massazh-shvz lessons
  console.log('📚 Updating massazh-shvz lessons...\n');
  for (const [lessonNum, playId] of Object.entries(MASSAZH_SHVZ_KINESCOPE_IDS)) {
    const lessonNumber = parseInt(lessonNum);
    
    // Find video ID
    const videoId = findVideoIdByPlayId(kinescopeVideos, playId);
    
    // Get current lesson
    const { data: lesson, error: fetchError } = await supabase
      .from('lessons')
      .select('id, content')
      .eq('course_id', shvzCourse.id)
      .eq('lesson_number', lessonNumber)
      .single();

    if (fetchError || !lesson) {
      console.log(`❌ Lesson ${lessonNumber}: Not found`);
      failed++;
      continue;
    }

    // Merge with existing content
    const updatedContent = {
      ...(lesson.content as any || {}),
      kinescope_play_id: playId,
      kinescope_video_id: videoId,
      kinescope_play_link: `https://kinescope.io/${playId}`
    };

    // Update lesson
    const { error: updateError } = await supabase
      .from('lessons')
      .update({ content: updatedContent })
      .eq('id', lesson.id);

    if (updateError) {
      console.log(`❌ Lesson ${lessonNumber}: Failed to update - ${updateError.message}`);
      failed++;
    } else {
      console.log(`✅ Lesson ${lessonNumber}: Added kinescope_play_id=${playId}${videoId ? `, video_id=${videoId.substring(0, 8)}...` : ' (video ID not found)'}`);
      updated++;
    }
  }

  // Update taping-basics lessons if course exists
  if (tapingCourse) {
    console.log('\n📚 Updating taping-basics lessons...\n');
    for (const [lessonNum, playId] of Object.entries(TAPING_BASICS_KINESCOPE_IDS)) {
      const lessonNumber = parseInt(lessonNum);
      
      // Find video ID
      const videoId = findVideoIdByPlayId(kinescopeVideos, playId);
      
      // Get current lesson
      const { data: lesson, error: fetchError } = await supabase
        .from('lessons')
        .select('id, content')
        .eq('course_id', tapingCourse.id)
        .eq('lesson_number', lessonNumber)
        .single();

      if (fetchError || !lesson) {
        console.log(`❌ Lesson ${lessonNumber}: Not found`);
        failed++;
        continue;
      }

      // Merge with existing content
      const updatedContent = {
        ...(lesson.content as any || {}),
        kinescope_play_id: playId,
        kinescope_video_id: videoId,
        kinescope_play_link: `https://kinescope.io/${playId}`
      };

      // Update lesson
      const { error: updateError } = await supabase
        .from('lessons')
        .update({ content: updatedContent })
        .eq('id', lesson.id);

      if (updateError) {
        console.log(`❌ Lesson ${lessonNumber}: Failed to update - ${updateError.message}`);
        failed++;
      } else {
        console.log(`✅ Lesson ${lessonNumber}: Added kinescope_play_id=${playId}${videoId ? `, video_id=${videoId.substring(0, 8)}...` : ' (video ID not found)'}`);
        updated++;
      }
    }
  }

  console.log('\n' + '═'.repeat(80));
  console.log(`✅ Updated: ${updated} lessons`);
  console.log(`❌ Failed: ${failed} lessons`);
  console.log('═'.repeat(80));
  console.log('\n💡 Run check-lesson-data.ts to verify the changes');
}

updateLessonsWithKinescopeIds().catch(console.error);
