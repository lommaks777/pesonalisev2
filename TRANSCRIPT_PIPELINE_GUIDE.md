# Course Transcript Processing Pipeline - User Guide

## Overview

The Course Transcript Processing Pipeline automates the generation of lesson transcripts from Kinescope video projects. This is **Phase 1** of the multi-course architecture implementation, enabling automated transcript generation as the foundation for personalized content delivery.

## What It Does

The pipeline performs the following steps automatically:

1. **Fetch Videos** - Retrieves video list from Kinescope project via API
2. **Download Videos** - Downloads 360p quality videos with resume support
3. **Extract Audio** - Converts video to MP3 audio using FFmpeg
4. **Chunk Audio** - Splits large audio files for Whisper API compliance (25 MB limit)
5. **Transcribe** - Processes audio through OpenAI Whisper API with rate limiting
6. **Assemble Transcript** - Combines chunks into full lesson transcript
7. **Store in Database** - Saves transcript to `lessons.content` JSONB field in Supabase
8. **Cleanup** - Removes temporary video and audio files to save storage

## Prerequisites

### 1. System Requirements

- **Node.js** 18+ with pnpm package manager
- **FFmpeg** installed and accessible in PATH
  ```bash
  # macOS
  brew install ffmpeg
  
  # Verify installation
  ffmpeg -version
  ```

### 2. API Keys & Environment Variables

Create or update `.env.local` with the following:

```bash
# Kinescope API
KINESCOPE_API_KEY=your_kinescope_api_key_here

# OpenAI API (for Whisper transcription)
OPENAI_API_KEY=your_openai_api_key_here

# Supabase Database
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**How to get Kinescope API key:**
1. Log in to Kinescope account
2. Navigate to Settings → API
3. Generate new API key
4. Copy key to `.env.local`

### 3. Database Setup

Ensure your Supabase database has the required schema (already included in `migrations/001_init.sql`):

- `courses` table - stores course metadata
- `lessons` table - stores lesson data including transcripts in `content` JSONB field
- `lesson_assets` table - stores video/audio metadata (optional for Phase 1)

## Usage

### Basic Usage

Process all lessons in a Kinescope project:

```bash
pnpm course:process-transcripts \
  --course-slug=back-massage \
  --course-title="Массаж спины" \
  --kinescope-project-id=abc123xyz
```

### Common Use Cases

#### 1. Process Specific Lesson Range

Process only lessons 5-10:

```bash
pnpm course:process-transcripts \
  --course-slug=back-massage \
  --course-title="Массаж спины" \
  --kinescope-project-id=abc123xyz \
  --start-lesson=5 \
  --end-lesson=10
```

#### 2. Resume Interrupted Processing

If processing was interrupted, resume from where it left off:

```bash
pnpm course:process-transcripts \
  --course-slug=back-massage \
  --course-title="Массаж спины" \
  --kinescope-project-id=abc123xyz \
  --resume
```

The `--resume` flag skips lessons that already have transcripts in the database.

#### 3. Re-transcribe Existing Audio

If you already have audio files and want to skip video download:

```bash
pnpm course:process-transcripts \
  --course-slug=back-massage \
  --course-title="Массаж спины" \
  --kinescope-project-id=abc123xyz \
  --skip-download
```

### All Command-Line Options

| Option | Required | Description | Default |
|--------|----------|-------------|---------|
| `--course-slug` | ✅ Yes | Course identifier (URL-safe, lowercase) | - |
| `--course-title` | ✅ Yes | Human-readable course title | - |
| `--kinescope-project-id` | ✅ Yes | Kinescope project ID or folder ID | - |
| `--course-description` | No | Course description text | Auto-generated |
| `--start-lesson` | No | Start processing from lesson N | 1 |
| `--end-lesson` | No | Stop processing at lesson N | All lessons |
| `--resume` | No | Skip lessons with existing transcripts | false |
| `--skip-download` | No | Skip video download and audio extraction | false |
| `--skip-transcription` | No | Skip transcription step (testing only) | false |
| `--help`, `-h` | No | Show help message | - |

## Output & Storage

### Database Storage

Transcripts are stored in the `lessons` table with the following structure:

```sql
-- lessons table
{
  "id": "uuid",
  "course_id": "uuid",
  "lesson_number": 1,
  "title": "Урок введение",
  "summary": "Урок 1: Урок введение",
  "content": {
    "transcription": "full transcript text here...",
    "transcription_length": 12500,
    "transcription_duration": 850.5,
    "transcription_language": "ru",
    "transcription_source": "openai-whisper-1",
    "transcription_date": "2025-01-15T10:30:00Z",
    "video_id": "abc123",
    "video_duration": 900
  }
}
```

### File System Storage

Temporary files are created during processing and cleaned up automatically:

```
store/{course-slug}/
├── videos/           # Downloaded MP4 files (deleted after processing)
│   └── 01-abc123.mp4
├── audio/            # Extracted MP3 files (deleted after processing)
│   └── 01-abc123.mp3
└── logs/             # Processing reports (kept)
    └── processing_1737027600000.json
```

### Processing Reports

Each run generates a JSON report in `store/{course-slug}/logs/`:

```json
{
  "timestamp": "2025-01-15T10:00:00Z",
  "options": {
    "courseSlug": "back-massage",
    "courseTitle": "Массаж спины",
    "kinescopeProjectId": "abc123"
  },
  "stats": {
    "total": 12,
    "successful": 11,
    "failed": 1,
    "skipped": 0,
    "errors": [
      {
        "lesson": 5,
        "error": "Whisper API timeout",
        "step": "transcription"
      }
    ]
  },
  "elapsed_minutes": 45.2
}
```

## Cost Estimation

### OpenAI Whisper API Costs

**Pricing:** $0.006 per minute of audio

**Example Course (12 lessons, 15 min average):**
- Total audio: 12 × 15 = 180 minutes
- **Cost: $1.08**

**Budget Planning:**
- Small course (5 lessons × 10 min): ~$0.30
- Medium course (12 lessons × 15 min): ~$1.10
- Large course (30 lessons × 20 min): ~$3.60

### Storage Requirements

**Temporary Storage (during processing):**
- Video files (360p): ~40-60 MB per lesson
- Audio files (128k MP3): ~10-15 MB per lesson
- **Peak usage:** ~70 MB per lesson (cleaned up automatically)

**Database Storage:**
- Transcript text: ~50 KB per lesson
- **Total for 12-lesson course:** ~600 KB

## Troubleshooting

### Common Issues

#### 1. FFmpeg Not Found

**Error:** `FFmpeg not found. Please install FFmpeg`

**Solution:**
```bash
# macOS
brew install ffmpeg

# Verify
ffmpeg -version
```

#### 2. Kinescope API Authentication Failed

**Error:** `Invalid Kinescope API key`

**Solution:**
- Verify `KINESCOPE_API_KEY` in `.env.local`
- Check API key has correct permissions in Kinescope dashboard
- Ensure no extra whitespace in environment variable

#### 3. Whisper API Rate Limit

**Error:** `Rate limited. Retrying...`

**Solution:**
- Script automatically retries with exponential backoff
- Default rate: ~50 requests/minute
- If persistent, check OpenAI API usage dashboard for quota

#### 4. Download Interrupted

**Error:** Network failure during video download

**Solution:**
```bash
# Use --resume flag to continue from last successful lesson
pnpm course:process-transcripts \
  --course-slug=your-course \
  --course-title="Your Course" \
  --kinescope-project-id=abc123 \
  --resume
```

#### 5. Audio File Too Large

**Warning:** `Chunk is 22.5 MB (over 20 MB limit)`

**Solution:**
- Script automatically chunks files >20 MB
- If warning persists, chunks are still processed (Whisper limit is 25 MB)
- Consider reducing segment duration in code if needed

### Debug Mode

For detailed logging, run the script directly with TypeScript:

```bash
npx tsx --env-file=.env.local scripts/process-course-transcripts.ts \
  --course-slug=test-course \
  --course-title="Test" \
  --kinescope-project-id=abc123 \
  2>&1 | tee processing.log
```

This saves all output to `processing.log` for debugging.

## Validation & Quality Assurance

### Automatic Validation

The script performs several quality checks:

1. **Transcript Length:** Warns if <500 characters
2. **UTF-8 Encoding:** Validates no encoding errors
3. **Word Count:** Alerts if suspiciously low (<50 words)
4. **File Integrity:** Verifies downloaded files are readable
5. **Audio Quality:** Checks extracted audio has valid stream

### Manual Verification

After processing, verify transcript quality:

```sql
-- Check transcript lengths
SELECT 
  lesson_number,
  title,
  content->>'transcription_length' as length,
  content->>'transcription_duration' as duration
FROM lessons
WHERE course_id = 'your-course-id'
ORDER BY lesson_number;

-- View sample transcript
SELECT 
  lesson_number,
  title,
  LEFT(content->>'transcription', 200) as preview
FROM lessons
WHERE course_id = 'your-course-id'
AND lesson_number = 1;
```

### Common Quality Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Very short transcript (<500 chars) | Low audio quality or silent video | Re-check source video |
| Foreign language detected | Wrong language hint | Add `language` parameter in code |
| Excessive "um", "uh" filler words | Casual speaking style | Normal for informal lessons |
| Missing punctuation | Whisper limitation | Post-process if needed for readability |

## Performance Optimization

### Parallel Processing

Currently, lessons are processed **sequentially** to respect API rate limits. To process multiple courses in parallel:

1. Run separate terminal sessions for different courses
2. Each course processes independently
3. Monitor total OpenAI API usage to stay within tier limits

### Resume Strategy

For large courses (20+ lessons):

1. **Initial Run:** Process first batch (lessons 1-10)
   ```bash
   pnpm course:process-transcripts ... --end-lesson=10
   ```

2. **Continue:** Process second batch (lessons 11-20)
   ```bash
   pnpm course:process-transcripts ... --start-lesson=11 --end-lesson=20
   ```

3. **Final Check:** Use `--resume` to catch any failed lessons
   ```bash
   pnpm course:process-transcripts ... --resume
   ```

## Integration with Existing System

### Next Steps After Transcription

Once transcripts are generated, you can:

1. **Generate Default Descriptions** (Phase 2)
   - Use existing `regenerate-lesson-templates.ts` logic
   - Process transcripts through GPT-4o to create structured lesson descriptions
   - Store in `lesson_descriptions` table

2. **Create Personalized Content** (Phase 3)
   - User completes survey
   - System generates personalized descriptions from transcripts + survey data
   - Store in `personalized_lesson_descriptions` table

3. **Deliver to Students** (Phase 4)
   - API endpoint `/api/persona/block` serves personalized or default content
   - GetCourse integration displays content in lessons

### Database Queries

**Get all lessons for a course:**
```sql
SELECT 
  lesson_number,
  title,
  content->>'transcription_length' as transcript_length
FROM lessons
WHERE course_id = (SELECT id FROM courses WHERE slug = 'back-massage')
ORDER BY lesson_number;
```

**Check transcription progress:**
```sql
SELECT 
  COUNT(*) as total_lessons,
  COUNT(CASE WHEN content ? 'transcription' THEN 1 END) as transcribed,
  COUNT(CASE WHEN content IS NULL THEN 1 END) as pending
FROM lessons
WHERE course_id = (SELECT id FROM courses WHERE slug = 'back-massage');
```

## Support & Maintenance

### Updating Dependencies

Keep Whisper and FFmpeg up to date:

```bash
# Update FFmpeg
brew upgrade ffmpeg

# Update OpenAI SDK
pnpm update openai
```

### Monitoring

Track processing metrics:

1. **Processing Time:** Average ~3-5 minutes per lesson
2. **Success Rate:** Target >95% successful transcriptions
3. **Cost Per Lesson:** Track in processing reports
4. **Storage Usage:** Monitor `store/` directory size

### Backup Strategy

Before processing large courses:

1. **Backup Database:**
   ```bash
   # Export lessons table
   npx supabase db dump --table lessons > backup.sql
   ```

2. **Keep Processing Reports:**
   - Reports in `store/{course}/logs/` contain recovery information
   - Don't delete logs directory

## FAQ

**Q: Can I process multiple courses simultaneously?**  
A: Yes, run separate terminal sessions with different `--course-slug` values. Monitor OpenAI API rate limits.

**Q: What happens if the script crashes mid-processing?**  
A: Use `--resume` flag to skip already-transcribed lessons. Temporary files are cleaned up automatically.

**Q: Can I re-transcribe a lesson with different parameters?**  
A: Yes, remove the transcript from the database first, then run the script again for that lesson range.

**Q: How do I find my Kinescope project ID?**  
A: In Kinescope dashboard, navigate to your project. The URL will contain the project ID: `kinescope.io/projects/{project-id}`

**Q: What video quality should I use?**  
A: 360p is recommended (balance between file size and Whisper accuracy). Script can be modified to use other qualities.

**Q: Can I use this with non-Russian languages?**  
A: Yes, modify the `language` parameter in `transcribeAudioFile()` call in the orchestration script.

## Related Documentation

- [Multi-Course Architecture Design](/design/MULTI_COURSE_ARCHITECTURE.md) - Full system design
- [Database Schema](/migrations/001_init.sql) - Supabase table definitions
- [Personalization Engine](/lib/services/personalization-engine.ts) - Phase 3 implementation
- [API Reference](/PERSONALIZATION_API.md) - Content delivery endpoints

## Changelog

**Version 1.0.0 (Phase 1)**
- Initial release
- Kinescope API integration
- Video download with resume support
- FFmpeg audio extraction
- Whisper API transcription with chunking
- Database storage in lessons.content JSONB
- Automatic cleanup of temporary files
- CLI orchestration script with progress tracking
