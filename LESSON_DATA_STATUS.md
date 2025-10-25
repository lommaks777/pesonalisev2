# Lesson Data Status Report

## Summary for massazh-shvz Course

### ✅ Data Available in Database

For each lesson (1-12) in the `massazh-shvz` course, the following data is **PRESENT**:

1. **Lesson Number** (`lesson_number` field) ✓
2. **Course Name** (via `course_id` → `courses.title`) ✓  
3. **Lesson Title** (`title` field) ✓
4. **Kinescope Play Link ID** (`content.kinescope_play_id`) ✓
   - Example: `qM9um324XRfRxWXKHDhm5c`
   - Full link: `https://kinescope.io/{play_id}`
5. **Template** (`content.template`) ✓

### ❌ Data Missing

1. **Transcription** (`content.transcription`) - **MISSING FOR ALL 12 LESSONS**
   - Transcripts exist in files but not yet migrated to database
   - Files location: `store/shvz/*.txt`
   
2. **Kinescope Video Content ID** (`content.kinescope_video_id`) - **MISSING FOR ALL 12 LESSONS**
   - These UUIDs are not in `kinescope-videos-list.json`
   - Would need to be fetched from Kinescope API or manually added

### 📊 Current Database Schema

```sql
-- lessons table
CREATE TABLE lessons (
  id uuid PRIMARY KEY,
  course_id uuid REFERENCES courses(id),
  lesson_number int NOT NULL,
  title text NOT NULL,
  summary text,                    -- Currently NULL for massazh-shvz
  content jsonb,                   -- Contains: template, kinescope_play_id, kinescope_play_link
  created_at timestamptz,
  UNIQUE(course_id, lesson_number)
);
```

### 📋 Content JSONB Structure (Current)

```json
{
  "template": {
    "👋 Введение": "...",
    "🔑 Ключевые моменты": [...],
    "💡 Практические советы": [...],
    "⚠️ Важно": [...],
    "📚 Домашнее задание": "...",
    "_мотивационная строка_": "..."
  },
  "kinescope_play_id": "qM9um324XRfRxWXKHDhm5c",
  "kinescope_play_link": "https://kinescope.io/qM9um324XRfRxWXKHDhm5c"
}
```

### 📋 Content JSONB Structure (Target - WITH Transcription)

```json
{
  "template": { ... },
  "kinescope_play_id": "qM9um324XRfRxWXKHDhm5c",
  "kinescope_play_link": "https://kinescope.io/qM9um324XRfRxWXKHDhm5c",
  "kinescope_video_id": "c8a90762-6fca-47a8-80c3-5f454ae05273",
  "transcription": "Full text here...",
  "transcription_length": 12500,
  "transcription_source": "file-migration",
  "transcription_date": "2025-10-24T...",
  "transcription_language": "ru"
}
```

## Next Steps to Complete Data

### 1. Add Transcriptions

The transcriptions exist as files but need to be migrated to database:

**Transcript Files Available:**
- `store/shvz/1-c8a90762-6fca-47a8-80c3-5f454ae05273.txt` (Lesson 1)
- `store/shvz/2-26ef3e23-3d2e-4461-80bf-622f26737528.txt` (Lesson 2)
- ... (all 12 lessons)

**Migration Script:**
```bash
npx tsx --env-file=.env.local scripts/migrate-transcripts-to-db.ts
```

**Note:** The script `migrate-transcripts-to-db.ts` already exists and uses the UUID mapping to match transcript files to lessons.

### 2. Add Kinescope Video Content IDs

Two options:

**Option A: Fetch from Kinescope API**
```bash
# Would need to implement a script to:
# 1. Use Kinescope API with the play_link ID
# 2. Extract the video content UUID
# 3. Update database
```

**Option B: Manual Mapping**
If you have access to Kinescope dashboard, you can:
1. Open each video by play_link: `https://kinescope.io/{play_id}`
2. Extract the video UUID from the page/API
3. Add to database manually or via SQL

**SQL Template:**
```sql
UPDATE lessons 
SET content = content || '{"kinescope_video_id": "uuid-here"}'::jsonb
WHERE course_id = (SELECT id FROM courses WHERE slug = 'massazh-shvz')
  AND lesson_number = 1;
```

## Verification Commands

**Check all lesson data:**
```bash
npx tsx --env-file=.env.local scripts/check-lesson-data.ts
```

**Check specific course:**
```bash
npx tsx --env-file=.env.local scripts/check-lesson-data.ts | grep -A 10 "massazh-shvz"
```

## Current Scripts Available

1. **check-lesson-data.ts** - Verify what data exists in database
2. **add-kinescope-ids-to-db.ts** - Add kinescope play IDs (✓ completed)
3. **migrate-transcripts-to-db.ts** - Migrate transcript files to database (ready to run)
4. **import-lessons.ts** - Import lesson templates from JSON files (already run)

## Transcript File to Lesson Number Mapping

Based on UUID in filename matching the content UUIDs:

| Lesson # | UUID (from filename) | Transcript File |
|----------|---------------------|-----------------|
| 1 | c8a90762-6fca-47a8-80c3-5f454ae05273 | 1-c8a90762-...-final.json |
| 2 | 26ef3e23-3d2e-4461-80bf-622f26737528 | 2-26ef3e23-...-final.json |
| 3 | 56766339-03e0-4c1b-9d99-cc49590ad3fd | 3-56766339-...-final.json |
| 4 | 8227a790-17ef-489a-8538-afbe2c4c10ce | 4-8227a790-...-final.json |
| 5 | f9b62dc5-9b76-491d-8b9b-2b72411df740 | 5-f9b62dc5-...-final.json |
| 6 | 1c75e3db-9afd-4237-8b8f-16be2b00ae0c | 6-1c75e3db-...-final.json |
| 7 | 387be494-dcf4-41a0-83c2-380fdd4f4cc1 | 7-387be494-...-final.json |
| 8 | 61b19549-d1bf-4265-bb1e-ff21ae7891a0 | 8-61b19549-...-final.json |
| 9 | e0f961c1-b8e3-4f57-939d-fb188d2703a9 | 9-e0f961c1-...-final.json |
| 10 | 913d5be1-bbfb-4d32-b4d2-157d10551389 | 10-913d5be1-...-final.json |
| 11 | 69b9560e-2af2-4690-af44-1398ace0f75e | 11-69b9560e-...-final.json |
| 12 | 722e1278-2dcf-4e76-baa3-8d674f3abda4 | 12-722e1278-...-final.json |
