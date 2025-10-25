-- Migration 004: Extract lesson fields from content JSONB to dedicated columns
-- This migration adds dedicated columns for transcription and Kinescope video IDs
-- to make queries simpler and improve database structure

-- Add transcription column
ALTER TABLE lessons
ADD COLUMN IF NOT EXISTS transcription TEXT;

-- Add Kinescope play link ID column (short ID from play_link, e.g., "qM9um324XRfRxWXKHDhm5c")
ALTER TABLE lessons
ADD COLUMN IF NOT EXISTS kinescope_play_link_id TEXT;

-- Add Kinescope video content ID column (full UUID from Kinescope API)
ALTER TABLE lessons
ADD COLUMN IF NOT EXISTS kinescope_video_content_id TEXT;

-- Add comments for documentation
COMMENT ON COLUMN lessons.transcription IS 'Full lesson transcript text';
COMMENT ON COLUMN lessons.kinescope_play_link_id IS 'Kinescope play link ID (short ID from https://kinescope.io/{id})';
COMMENT ON COLUMN lessons.kinescope_video_content_id IS 'Kinescope video content ID (full UUID from Kinescope API)';

-- Migrate existing data from content JSONB to new columns
UPDATE lessons
SET 
  transcription = content->>'transcription',
  kinescope_play_link_id = content->>'kinescope_play_id',
  kinescope_video_content_id = content->>'kinescope_video_id'
WHERE content IS NOT NULL;

-- Optional: Clean up migrated data from content JSONB to avoid duplication
-- Uncomment the following lines if you want to remove these fields from content JSONB
-- UPDATE lessons
-- SET content = content - 'transcription' - 'kinescope_play_id' - 'kinescope_video_id'
-- WHERE content IS NOT NULL;
