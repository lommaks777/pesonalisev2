# Database Reset and Population Guide

## Overview

This guide will help you completely reset and repopulate the database with correct lesson data from `courses_rules.md`.

## Prerequisites

**IMPORTANT:** Before running the reset script, you MUST apply migration 004 to add new database columns.

### Step 1: Apply Migration 004

1. Open **Supabase Dashboard** (https://supabase.com/dashboard)
2. Go to **SQL Editor**
3. Copy the contents of `migrations/004_extract_lesson_fields.sql`
4. Paste and **Run** in SQL Editor

This adds the following columns to the `lessons` table:
- `transcription` (TEXT)
- `kinescope_play_link_id` (TEXT)
- `kinescope_video_content_id` (TEXT)
- `default_description` (JSONB) - added in migration 002

### Step 2: Verify Migration Applied

```bash
npx tsx --env-file=.env.local scripts/apply-migration-004.ts
```

You should see: ✅ Migration 004 has been applied!

## Reset and Populate Database

### What This Script Does

The `reset-and-populate-courses.ts` script will:

1. ✅ **Clear all existing data**:
   - Delete all personalized lesson descriptions
   - Delete all lessons (keeps courses)

2. ✅ **Recreate all lessons** from `courses_rules.md`:
   - **massazh-shvz**: 12 lessons
   - **taping-basics**: 28 lessons

3. ✅ **Populate lesson data**:
   - `lesson_number` - from courses_rules.md
   - `kinescope_play_link_id` - extracted from Kinescope URLs
   - `transcription` - loaded from `store/{course}/*.txt` files (if exist)
   - `default_description` - loaded from `store/{course}/*-final.json` (if exist)
   - `kinescope_video_content_id` - will be NULL (can be filled later)

### Run the Script

```bash
npx tsx --env-file=.env.local scripts/reset-and-populate-courses.ts
```

### Expected Output

```
🔄 Starting Database Reset and Population

Step 1: Clearing existing data...
  ✅ Cleared all personalizations
  ✅ Cleared all lessons

Step 2: Setting up courses...

📚 Course: massazh-shvz
  ✅ Course already exists (id: abc12345...)
  Creating 12 lessons...
  ✅ Created 12/12 lessons
     - With transcription: 12
     - With default_description: 12

📚 Course: taping-basics
  ✅ Course already exists (id: def67890...)
  Creating 28 lessons...
  ✅ Created 28/28 lessons
     - With transcription: 0
     - With default_description: 5

Step 4: Verification...

✅ massazh-shvz: 12 lessons
   Sample lesson 1:
   - Title: Урок 1
   - Kinescope ID: qM9um324XRfRxWXKHDhm5c
   - Has transcription: ✅
   - Has default_description: ✅

✅ taping-basics: 28 lessons
   Sample lesson 1:
   - Title: Урок 1
   - Kinescope ID: bNY6pPPffmFwo1H72oxyD9
   - Has transcription: ❌
   - Has default_description: ✅

✅ Database reset and population complete!
```

## Verify Results in Supabase

Run this SQL query in Supabase SQL Editor:

```sql
SELECT 
  c.slug as course,
  COUNT(l.id) as total_lessons,
  COUNT(l.transcription) as with_transcription,
  COUNT(l.default_description) as with_description,
  COUNT(l.kinescope_play_link_id) as with_kinescope_id
FROM courses c
LEFT JOIN lessons l ON l.course_id = c.id
GROUP BY c.slug
ORDER BY c.slug;
```

Expected results:
- **massazh-shvz**: 12 lessons, all with transcription, description, and kinescope_id
- **taping-basics**: 28 lessons, all with kinescope_id, some with transcription/description

## What's Next?

After reset, you may want to:

1. **Generate missing transcriptions** for taping-basics lessons
2. **Generate missing default_descriptions** for lessons without them
3. **Populate kinescope_video_content_id** from Kinescope API (optional)

## Troubleshooting

**Error: "column lessons.transcription does not exist"**
- You forgot to apply migration 004 first
- Go back to Step 1 and apply the migration

**Some lessons missing transcription/description**
- This is expected if files don't exist in `store/` directory
- You can generate them later using generation scripts

**Error: "unique constraint violated"**
- A lesson with this number already exists for the course
- This shouldn't happen after clearing, but you can manually delete lessons first
