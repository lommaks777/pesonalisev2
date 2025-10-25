# Applying Migration 004 - Quick Guide

## What This Migration Does

Adds three new direct columns to the `lessons` table:
- `transcription` - full lesson transcript text (TEXT)
- `kinescope_play_link_id` - short Kinescope player ID (TEXT)
- `kinescope_video_content_id` - full Kinescope video UUID (TEXT)

And migrates data from the JSONB `content` field to these new columns.

## How to Apply (2 Steps)

### Step 1: Run Migration in Supabase SQL Editor

**Important:** The migration must be applied directly in Supabase Dashboard because the client doesn't support executing DDL statements.

1. Open your **Supabase Dashboard** (https://supabase.com/dashboard)
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Open the file `migrations/004_extract_lesson_fields.sql`
5. Copy the **entire contents** 
6. Paste into the Supabase SQL Editor
7. Click **Run** (or press Cmd/Ctrl + Enter)

You should see success messages indicating columns were added and data was migrated.

### Step 2: Verify Migration Applied Successfully

Run the verification script:

```bash
npx tsx --env-file=.env.local scripts/apply-migration-004.ts
```

**Expected output:**
```
✅ Migration 004 has been applied!

🔍 Checking lesson data...

Found 3 lessons. Sample data:

Lesson 1: ...
  - Transcription: ✅ (12500 chars) or ❌ Missing
  - Kinescope Play ID: qM9um324... or ❌ Missing
  - Kinescope Video ID: abc-123... or ❌ Missing
```

## After Migration

Each lesson now has direct access to:

✅ `lesson_number` - lesson number (already existed)
✅ `course_name` - course name (via JOIN with courses table)
✅ `transcription` - full transcript (**new**)
✅ `default_description` - default description (added in migration 002)
✅ `kinescope_play_link_id` - player link ID (**new**)
✅ `kinescope_video_content_id` - video UUID (**new**)

## Verify in SQL

You can also verify directly in Supabase SQL Editor:

```sql
SELECT 
  l.lesson_number,
  c.title as course_name,
  l.transcription IS NOT NULL as has_transcription,
  l.default_description IS NOT NULL as has_default_description,
  l.kinescope_play_link_id,
  l.kinescope_video_content_id,
  length(l.transcription) as transcript_length
FROM lessons l
JOIN courses c ON l.course_id = c.id
ORDER BY l.lesson_number
LIMIT 5;
```

## Code Updates

✅ TypeScript types updated in `lib/supabase/types.ts`
✅ Personalization code updated in `lib/services/personalization-engine.ts`

The system now uses direct columns instead of nested JSONB fields!

## Troubleshooting

**If verification script says "Migration has NOT been applied":**
- Make sure you ran the SQL in Supabase Dashboard (Step 1)
- Check for any error messages in the SQL Editor
- Verify you have the correct Supabase project selected

**If data is missing after migration:**
- Check if data existed in `content` JSONB before migration
- Run the data migration UPDATE statement separately if needed
