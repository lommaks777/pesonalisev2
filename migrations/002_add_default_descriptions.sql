-- Add default_description column to lessons table
-- This field stores standard (non-personalized) lesson descriptions
-- for users who haven't completed the survey

ALTER TABLE lessons
ADD COLUMN IF NOT EXISTS default_description jsonb;

-- Add comment for documentation
COMMENT ON COLUMN lessons.default_description IS 'Standard lesson description shown to non-registered users (JSONB structure with introduction, what_you_will_learn, practical_benefits, etc.)';
