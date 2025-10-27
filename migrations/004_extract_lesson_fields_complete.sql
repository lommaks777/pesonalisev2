-- Complete Migration: Add all required lesson fields
-- Combines migrations 002 and 004 for fresh database setup
-- Run this in Supabase SQL Editor

-- Step 1: Add default_description column (from migration 002)
ALTER TABLE lessons
ADD COLUMN IF NOT EXISTS default_description jsonb;

COMMENT ON COLUMN lessons.default_description IS 'Standard lesson description shown to non-registered users (JSONB structure with introduction, what_you_will_learn, practical_benefits, etc.)';

-- Step 2: Add transcription column (from migration 004)
ALTER TABLE lessons
ADD COLUMN IF NOT EXISTS transcription TEXT;

COMMENT ON COLUMN lessons.transcription IS 'Full lesson transcript text';

-- Step 3: Add Kinescope play link ID column
ALTER TABLE lessons
ADD COLUMN IF NOT EXISTS kinescope_play_link_id TEXT;

COMMENT ON COLUMN lessons.kinescope_play_link_id IS 'Kinescope play link ID (short ID from https://kinescope.io/{id})';

-- Step 4: Add Kinescope video content ID column
ALTER TABLE lessons
ADD COLUMN IF NOT EXISTS kinescope_video_content_id TEXT;

COMMENT ON COLUMN lessons.kinescope_video_content_id IS 'Kinescope video content ID (full UUID from Kinescope API)';

-- Step 5: Migrate existing data from content JSONB to new columns (if any data exists)
UPDATE lessons
SET 
  transcription = content->>'transcription',
  kinescope_play_link_id = content->>'kinescope_play_id',
  kinescope_video_content_id = content->>'kinescope_video_id'
WHERE content IS NOT NULL
  AND (
    content->>'transcription' IS NOT NULL 
    OR content->>'kinescope_play_id' IS NOT NULL
    OR content->>'kinescope_video_id' IS NOT NULL
  );

-- Verification query (optional - uncomment to run)
-- SELECT 
--   column_name, 
--   data_type, 
--   is_nullable,
--   column_default
-- FROM information_schema.columns
-- WHERE table_name = 'lessons'
--   AND column_name IN ('default_description', 'transcription', 'kinescope_play_link_id', 'kinescope_video_content_id')
-- ORDER BY column_name;
