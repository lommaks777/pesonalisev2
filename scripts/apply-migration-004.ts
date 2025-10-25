/**
 * Apply migration 004: Extract lesson fields from content JSONB
 * 
 * Adds dedicated columns for:
 * - transcription
 * - kinescope_play_link_id  
 * - kinescope_video_content_id
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

async function applyMigration() {
  console.log('🚀 Checking Migration 004 Status\n');

  try {
    // Try to select the new columns - if they don't exist, we'll get an error
    console.log('Checking if new columns exist...');
    const { data: testData, error: testError } = await supabase
      .from('lessons')
      .select('transcription, kinescope_play_link_id, kinescope_video_content_id')
      .limit(1);

    if (testError) {
      console.log('\n❌ Migration 004 has NOT been applied yet.');
      console.log('\n📋 Please apply the migration manually:\n');
      console.log('1. Open Supabase Dashboard');
      console.log('2. Go to SQL Editor');
      console.log('3. Copy and paste the contents of migrations/004_extract_lesson_fields.sql');
      console.log('4. Click "Run"');
      console.log('5. Re-run this script to verify\n');
      console.log('Error details:', testError.message);
      process.exit(1);
    }

    console.log('✅ Migration 004 has been applied!\n');

    // Verify new columns exist and show sample data
    console.log('🔍 Checking lesson data...\n');
    
    const { data: lessons, error: selectError } = await supabase
      .from('lessons')
      .select('id, lesson_number, title, transcription, kinescope_play_link_id, kinescope_video_content_id')
      .order('lesson_number')
      .limit(3);

    if (selectError) {
      console.error('❌ Error fetching lessons:', selectError.message);
    } else if (lessons) {
      console.log(`Found ${lessons.length} lessons. Sample data:\n`);
      lessons.forEach(lesson => {
        console.log(`Lesson ${lesson.lesson_number}: ${lesson.title}`);
        console.log(`  - Transcription: ${lesson.transcription ? `✅ (${lesson.transcription.length} chars)` : '❌ Missing'}`);
        console.log(`  - Kinescope Play ID: ${lesson.kinescope_play_link_id || '❌ Missing'}`);
        console.log(`  - Kinescope Video ID: ${lesson.kinescope_video_content_id || '❌ Missing'}`);
        console.log('');
      });
    }

    console.log('✅ Migration verification complete!\n');

  } catch (error) {
    console.error('❌ Critical error:', error);
    process.exit(1);
  }
}

applyMigration();
