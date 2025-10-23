# Multi-Course Processing Guide

Comprehensive guide for processing multiple courses from Kinescope folders.

## Quick Start

### 1. Check Videos in a Folder

First, verify what videos are available in the Kinescope folder:

```bash
# Using the new command
pnpm course:check-videos "https://app.kinescope.io/video?segment=eyJwYXJlbnRfaWQiOiI2NTI3MjE0Mi0xNWExLTQ3ZmEtOTAzZS1jNzc5ZjEwMWYxNDkifQ"

# Or run the script directly
npx tsx --env-file=.env.local scripts/check-kinescope-video-details.ts "URL"
```

This will:
- Extract the `folder_id` from the URL
- List all videos in that folder
- Show video titles, durations, and IDs
- Save full details to `kinescope-videos-list.json`

### 2. Process a Course from URL

The easiest way to process an entire course:

```bash
pnpm course:process-from-url \
  --url="https://app.kinescope.io/video?segment=eyJwYXJlbnRfaWQiOiI2NTI3MjE0Mi0xNWExLTQ3ZmEtOTAzZS1jNzc5ZjEwMWYxNDkifQ" \
  --course-slug=taping-basics \
  --course-title="Основы тейпирования"
```

This single command will:
1. Extract the folder_id from the URL
2. Fetch all videos from the Kinescope folder
3. Download each video (360p quality)
4. Extract audio using FFmpeg
5. Transcribe audio using OpenAI Whisper
6. Save transcripts to the database
7. Clean up temporary files

## Advanced Usage

### Process Specific Lesson Range

```bash
pnpm course:process-from-url \
  --url="..." \
  --course-slug=taping-basics \
  --course-title="Основы тейпирования" \
  --start-lesson=5 \
  --end-lesson=10
```

### Resume Interrupted Processing

If processing fails or is interrupted, resume without re-processing existing lessons:

```bash
pnpm course:process-from-url \
  --url="..." \
  --course-slug=taping-basics \
  --course-title="Основы тейпирования" \
  --resume
```

### Add Course Description

```bash
pnpm course:process-from-url \
  --url="..." \
  --course-slug=taping-basics \
  --course-title="Основы тейпирования" \
  --course-description="Полный курс по кинезиотейпированию для массажистов"
```

### Skip Steps (for debugging)

```bash
# Skip download and audio extraction (use existing files)
pnpm course:process-from-url \
  --url="..." \
  --course-slug=taping-basics \
  --course-title="Основы тейпирования" \
  --skip-download

# Skip transcription (useful for testing pipeline)
pnpm course:process-from-url \
  --url="..." \
  --course-slug=taping-basics \
  --course-title="Основы тейпирования" \
  --skip-transcription
```

## Using folder_id Directly

If you already know the folder_id, you can use the main processing script:

```bash
pnpm course:process-transcripts \
  --kinescope-folder-id=65272142-15a1-47fa-903e-c779f101f149 \
  --course-slug=taping-basics \
  --course-title="Основы тейпирования"
```

## Using project_id (Legacy)

For older projects using project_id instead of folder_id:

```bash
pnpm course:process-transcripts \
  --kinescope-project-id=abc123 \
  --course-slug=back-massage \
  --course-title="Массаж спины"
```

## Course Metadata Management

### Recommended Course Slug Format

Use lowercase, hyphen-separated slugs:
- ✅ `taping-basics`
- ✅ `shvz-massage`
- ✅ `back-massage-advanced`
- ❌ `TapingBasics`
- ❌ `taping_basics`
- ❌ `тейпирование`

### Course Structure in Database

Courses are stored in Supabase with:
- `id` (UUID, auto-generated)
- `slug` (unique identifier, used in URLs)
- `title` (display name)
- `description` (optional, auto-generated if not provided)
- `created_at`, `updated_at` timestamps

Lessons are linked to courses via `course_id` foreign key.

## File Structure

After processing, files are organized as:

```
store/
├── {course-slug}/
│   ├── videos/          # Temporary (deleted after processing)
│   │   ├── 01-{video-id}.mp4
│   │   ├── 02-{video-id}.mp4
│   │   └── ...
│   ├── audio/           # Temporary (deleted after processing)
│   │   ├── 01-{video-id}.mp3
│   │   ├── 02-{video-id}.mp3
│   │   └── ...
│   └── logs/            # Processing reports
│       └── processing_{timestamp}.json
```

Transcripts are stored in the database (`lessons` table), not as files.

## Processing Pipeline Steps

For each video, the pipeline executes:

### 1. Download Video (360p)
- Fetches the video file from Kinescope
- Stores temporarily in `store/{course-slug}/videos/`
- Shows download progress

### 2. Extract Audio
- Uses FFmpeg to extract audio as MP3
- 128kbps bitrate for optimal quality/size balance
- Stores temporarily in `store/{course-slug}/audio/`

### 3. Transcribe Audio
- Uses OpenAI Whisper API (`whisper-1` model)
- Language hint: Russian (`ru`)
- Returns full transcript text with metadata

### 4. Save to Database
- Inserts/updates lesson in Supabase
- Stores transcript with metadata:
  - `transcription` - full text
  - `transcription_length` - character count
  - `transcription_duration` - audio duration
  - `transcription_language` - detected language
  - `transcription_source` - "openai-whisper-1"
  - `transcription_date` - timestamp
  - `video_id` - Kinescope video ID
  - `video_duration` - video length in seconds

### 5. Cleanup
- Deletes temporary video file
- Deletes temporary audio file
- Saves processing report to logs

## Error Handling

### Common Issues

**"FFmpeg not found"**
```bash
# Install FFmpeg on macOS
brew install ffmpeg

# Verify installation
ffmpeg -version
```

**"KINESCOPE_API_KEY not found"**
- Add to `.env.local`:
  ```
  KINESCOPE_API_KEY=your_api_key_here
  ```

**"OPENAI_API_KEY not found"**
- Add to `.env.local`:
  ```
  OPENAI_API_KEY=sk-...
  ```

**"Не удалось создать курс: unique constraint violated"**
- Course slug already exists
- Use a different slug or update existing course

**Rate limiting (429 errors)**
- The pipeline automatically retries with exponential backoff
- If it persists, reduce concurrent processing

### Resume After Failure

If processing fails midway:

1. Check the error message in console
2. Fix the underlying issue (e.g., missing API key, no disk space)
3. Resume with `--resume` flag:
   ```bash
   pnpm course:process-from-url \
     --url="..." \
     --course-slug=taping-basics \
     --course-title="Основы тейпирования" \
     --resume
   ```

The `--resume` flag skips lessons that already have transcripts in the database.

## Processing Reports

After each processing run, a report is saved to:
```
store/{course-slug}/logs/processing_{timestamp}.json
```

The report contains:
- Processing options (slug, title, URL, etc.)
- Statistics (total, successful, failed, skipped)
- Detailed error list (if any)
- Elapsed time in minutes

## Multi-Course Workflow

### Scenario: Processing Multiple Courses

```bash
# Course 1: Taping basics
pnpm course:process-from-url \
  --url="https://app.kinescope.io/video?segment=..." \
  --course-slug=taping-basics \
  --course-title="Основы тейпирования"

# Course 2: Back massage
pnpm course:process-from-url \
  --url="https://app.kinescope.io/video?segment=..." \
  --course-slug=back-massage \
  --course-title="Массаж спины"

# Course 3: Face massage
pnpm course:process-from-url \
  --url="https://app.kinescope.io/video?segment=..." \
  --course-slug=face-massage \
  --course-title="Массаж лица"
```

Each course will:
- Have its own folder in `store/`
- Be a separate entry in the `courses` table
- Have lessons numbered starting from 1
- Generate independent processing reports

## Next Steps After Processing

Once transcripts are processed:

### 1. Generate Lesson Templates

Create structured lesson descriptions ("fish") from transcripts:

```bash
pnpm templates:regenerate
```

This uses GPT-4o to analyze transcripts and generate:
- Introduction
- Key points
- Practical tips
- Important notes
- Equipment preparation
- Homework
- Motivational line

Templates are saved to `store/{course-slug}/lessons/`.

### 2. Import to Database

If using file-based templates, import them:

```bash
pnpm db:seed
```

### 3. Test Personalization

Verify the personalization engine works with the new course:

```bash
npx tsx --env-file=.env.local scripts/test-personalization-engine.ts \
  --course-slug=taping-basics \
  --lesson-number=1
```

## Environment Variables Reference

Required in `.env.local`:

```env
# Kinescope API
KINESCOPE_API_KEY=your_kinescope_api_key

# OpenAI (for Whisper transcription and personalization)
OPENAI_API_KEY=sk-...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

Optional:
```env
# Override Kinescope API URL (defaults to https://api.kinescope.io/v1)
KINESCOPE_API_URL=https://api.kinescope.io/v1

# Supabase service role key (if needed for privileged operations)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Command Reference

```bash
# Check videos in folder
pnpm course:check-videos "URL"

# Process course from URL (recommended)
pnpm course:process-from-url [options]

# Process course using folder_id or project_id directly
pnpm course:process-transcripts [options]

# Regenerate lesson templates
pnpm templates:regenerate

# Database operations
pnpm db:migrate           # Run migrations
pnpm db:seed              # Import lessons from files
pnpm db:update-lessons    # Update lesson numbers
```

## Tips for Efficient Processing

1. **Start with one lesson** to verify the pipeline:
   ```bash
   --start-lesson=1 --end-lesson=1
   ```

2. **Use resume mode** for long courses to handle interruptions:
   ```bash
   --resume
   ```

3. **Check videos first** to verify folder access:
   ```bash
   pnpm course:check-videos "URL"
   ```

4. **Monitor disk space** - video files can be large (cleaned up automatically)

5. **Save processing reports** - helpful for debugging and tracking progress

6. **Use meaningful slugs** - they appear in URLs and file paths

## Troubleshooting

### Video Download Fails

- Check internet connection
- Verify Kinescope API key is valid
- Try lower quality: edit script to use '360p' instead of higher

### Transcription Takes Too Long

- Normal for long videos (10 min video ≈ 2-3 min transcription)
- OpenAI Whisper API processes in real-time or slower
- Consider processing in batches overnight

### Out of Disk Space

- Videos are downloaded temporarily and deleted after processing
- Peak usage: ~500 MB per lesson (for 10 min 360p video)
- Ensure at least 5 GB free space for safety

### Database Connection Issues

- Verify Supabase credentials in `.env.local`
- Check internet connection
- Verify Supabase project is active

## Getting Help

For issues or questions:

1. Check processing report in `store/{course-slug}/logs/`
2. Review error messages in console output
3. Verify all environment variables are set
4. Try processing a single lesson to isolate the problem
5. Check Kinescope and OpenAI API status pages
