-- Migration 003: Fix multi-course profile support
-- Allow users to have separate profiles for different courses

-- 1. Drop old unique constraint on user_identifier
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_user_identifier_key;

-- 2. Add composite unique constraint on (user_identifier, course_slug)
-- This allows one user to have multiple profiles - one per course
ALTER TABLE profiles 
ADD CONSTRAINT profiles_user_course_unique 
UNIQUE (user_identifier, course_slug);

-- 3. Make course_slug NOT NULL (it's required for the composite key)
ALTER TABLE profiles 
ALTER COLUMN course_slug SET NOT NULL;

-- 4. Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_user_course 
ON profiles(user_identifier, course_slug);

-- 5. Add comment for documentation
COMMENT ON CONSTRAINT profiles_user_course_unique ON profiles IS 
'Each user can have one profile per course. When a user fills out a survey for a new course, a new profile is created. When re-filling for the same course, the existing profile is updated.';
