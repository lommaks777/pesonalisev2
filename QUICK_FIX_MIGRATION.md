# ✅ Quick Fix: Apply Migration and Reset Database

## Current Status
❌ Migration NOT applied yet (columns don't exist in database)

## What You Need To Do

### Step 1: Apply the Complete Migration ⚡

1. **Open Supabase Dashboard**: https://supabase.com/dashboard
2. **Click SQL Editor** (left sidebar)
3. **Click "New Query"**
4. **Copy and paste** the entire contents of:
   - File: `migrations/004_extract_lesson_fields_complete.sql`
5. **Click RUN** (or press Cmd/Ctrl + Enter)

You should see success messages like:
```
Success. No rows returned
ALTER TABLE
ALTER TABLE
ALTER TABLE
ALTER TABLE
UPDATE
```

### Step 2: Run the Reset Script Again 🔄

After the migration is applied:

```bash
npx tsx --env-file=.env.local scripts/reset-and-populate-courses.ts
```

This will:
- Clear all lessons
- Recreate 12 lessons for massazh-shvz
- Recreate 28 lessons for taping-basics
- Load transcriptions from .txt files
- Load default_descriptions from -final.json files

### Step 3: Verify Everything Worked ✅

```bash
npx tsx --env-file=.env.local scripts/verify-database-state.ts
```

Expected output:
```
✅ Migration 004 applied successfully
✅ massazh-shvz: 12 lessons (Expected: 12)
✅ taping-basics: 28 lessons (Expected: 28)
```

## Why This Happened

The migration script (`apply-migration-004.ts`) can't execute DDL commands through Supabase client. You must run migrations directly in the Supabase SQL Editor.

The new file `004_extract_lesson_fields_complete.sql` includes BOTH:
- Migration 002 (default_description column)
- Migration 004 (transcription, kinescope_play_link_id, kinescope_video_content_id)

So you only need to run ONE SQL file to get everything ready! 🚀
