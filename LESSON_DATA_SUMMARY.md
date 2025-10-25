# Lesson Data Summary - massazh-shvz Course

## ✅ Current Status: What's in the Database

For all 12 lessons in the **massazh-shvz** (Массаж ШВЗ) course:

### 1. **Lesson Number** ✅ 
- Field: `lesson_number`
- Status: **Present** for all 12 lessons
- Values: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12

### 2. **Course Name** ✅
- Accessed via: `course_id` → `courses.slug` / `courses.title`
- Status: **Present** for all lessons
- Values:
  - Slug: `massazh-shvz`
  - Title: `Массаж ШВЗ`

### 3. **Lesson Title** ✅
- Field: `title`
- Status: **Present** for all 12 lessons
- Examples:
  - Lesson 1: "Урок введение."
  - Lesson 2: "ШВЗ Мышцы, с которыми мы будем работать в этом курсе теория с картинками++++"
  - Lesson 4: "Что такое триггерные точки"

### 4. **Kinescope Play Link ID** ✅
- Field: `content.kinescope_play_id`
- Status: **Present** for all 12 lessons
- Format: 22-character alphanumeric string
- Examples:
  - Lesson 1: `qM9um324XRfRxWXKHDhm5c`
  - Lesson 2: `5NRs6UHWgMX9RtHqxNGy8j`
  - Lesson 4: `h5bu4F6D9Cwk3jBnXzLyjJ`
- Full link format: `https://kinescope.io/{play_id}`

### 5. **Lesson Template** ✅
- Field: `content.template`
- Status: **Present** for all 12 lessons  
- Structure: 7-section emoji-keyed JSONB
  - 👋 Введение
  - 🔑 Ключевые моменты
  - 💡 Практические советы
  - ⚠️ Важно
  - 📚 Домашнее задание
  - _мотивационная строка_

## ❌ Missing Data

### 6. **Transcription** ❌
- Field: `content.transcription`
- Status: **MISSING** for all 12 lessons
- Note: Transcript files exist in `store/shvz/*.txt` but not yet migrated to database
- Files available:
  - `store/shvz/2-c8a90762-6fca-47a8-80c3-5f454ae05273.txt`
  - `store/shvz/12-12-26ef3e23-3d2e-4461-80bf-622f26737528.txt`
  - ... (12 files total)

### 7. **Kinescope Video Content ID** ❌
- Field: `content.kinescope_video_id`
- Status: **MISSING** for all 12 lessons
- Format: UUID (e.g., `0e1c4944-6fce-4db3-940a-b76912294ec2`)
- Note: These UUIDs are not in `kinescope-videos-list.json` (which only contains taping course videos)
- Requires: Kinescope API call or manual extraction

## 📊 Database Schema

```sql
-- Current structure
CREATE TABLE lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses(id),
  lesson_number int NOT NULL,
  title text NOT NULL,
  summary text,                    -- NULL for massazh-shvz
  content jsonb,                   -- See structure below
  created_at timestamptz DEFAULT now(),
  UNIQUE(course_id, lesson_number)
);
```

## 📋 Content JSONB Structure

**Current State (All fields present except transcription & kinescope_video_id):**

```json
{
  "template": {
    "👋 Введение": "Этот урок посвящён изучению мышц...",
    "🔑 Ключевые моменты": [
      "Узнаете про мышцы-разгибатели...",
      "..."
    ],
    "💡 Практические советы": [
      "Работайте с первопричиной...",
      "..."
    ],
    "⚠️ Важно": [
      "Неправильное положение головы..."
    ],
    "📚 Домашнее задание": "Изучите анатомию...",
    "_мотивационная строка_": "*Знание анатомии — основа...*"
  },
  "kinescope_play_id": "qM9um324XRfRxWXKHDhm5c",
  "kinescope_play_link": "https://kinescope.io/qM9um324XRfRxWXKHDhm5c"
}
```

**Target State (All requested fields):**

```json
{
  "template": { ... },
  "kinescope_play_id": "qM9um324XRfRxWXKHDhm5c",
  "kinescope_play_link": "https://kinescope.io/qM9um324XRfRxWXKHDhm5c",
  "kinescope_video_id": "UUID-here",
  "transcription": "Full video transcript text...",
  "transcription_length": 12500,
  "transcription_source": "file-migration",
  "transcription_date": "2025-10-24T...",
  "transcription_language": "ru"
}
```

## 📈 Completion Status

| Data Field | Status | Coverage | Location |
|------------|--------|----------|----------|
| Lesson Number | ✅ Complete | 12/12 | `lesson_number` |
| Course Name | ✅ Complete | 12/12 | `course_id` → `courses` |
| Lesson Title | ✅ Complete | 12/12 | `title` |
| Kinescope Play ID | ✅ Complete | 12/12 | `content.kinescope_play_id` |
| Lesson Template | ✅ Complete | 12/12 | `content.template` |
| Transcription | ❌ Missing | 0/12 | Files exist, not in DB |
| Kinescope Video ID | ❌ Missing | 0/12 | Needs API or manual entry |

**Overall Completion: 5/7 fields (71%)**

## 🔧 Scripts Available

1. **check-lesson-data.ts** - Verify database content
   ```bash
   npx tsx --env-file=.env.local scripts/check-lesson-data.ts
   ```

2. **add-kinescope-ids-to-db.ts** - Add Kinescope play IDs (✓ completed)
   ```bash
   npx tsx --env-file=.env.local scripts/add-kinescope-ids-to-db.ts
   ```

3. **migrate-transcripts-to-db.ts** - Migrate transcripts (needs file mapping fix)
   ```bash
   npx tsx --env-file=.env.local scripts/migrate-transcripts-to-db.ts
   ```

## 📝 Next Steps

To complete the remaining 2/7 fields:

### Option 1: Add Transcriptions

**Challenge:** Transcript filenames don't directly match lesson numbers
- File: `2-c8a90762-...txt` contains content for Lesson 1 (UUID mismatch)
- Need to manually map or fix the migration script

**Solution A:** Manual SQL updates per lesson
```sql
UPDATE lessons 
SET content = content || jsonb_build_object(
  'transcription', 'Full text here...',
  'transcription_length', 12500
)
WHERE course_id = (SELECT id FROM courses WHERE slug = 'massazh-shvz')
  AND lesson_number = 1;
```

**Solution B:** Fix migration script UUID mapping

### Option 2: Add Kinescope Video IDs

**Requires:**
1. Access to Kinescope API or dashboard
2. For each play_id, extract the corresponding video UUID
3. Update database

**Manual SQL Template:**
```sql
UPDATE lessons 
SET content = content || '{"kinescope_video_id": "uuid-here"}'::jsonb
WHERE course_id = (SELECT id FROM courses WHERE slug = 'massazh-shvz')
  AND lesson_number = 1;
```

## ✅ Accomplishments

1. ✅ Added Kinescope play link IDs to all 12 lessons
2. ✅ Fixed lesson 2 template (muscles content)
3. ✅ Fixed lessons 4 & 11 swap (trigger points & post-isometric)
4. ✅ Verified 7/12 lessons have correct content matching titles
5. ✅ Created comprehensive data checking and reporting scripts
6. ✅ Documented complete database schema and required fields

## 📊 Test Results Summary

Last test run (after fixes):
- **Total lessons:** 12
- **Correct content:** 7/12 (58%)
  - Lessons 1, 2, 3, 4, 5, 6, 7 ✓
- **Incorrect content:** 5/12 (42%)
  - Lessons 8, 9, 10, 11, 12 need template fixes

**Remaining work:** Fix templates for lessons 8-12 to match their titles.
