# Transcript Pipeline - Quick Reference

## Quick Start

### Basic Usage
```bash
pnpm course:process-transcripts \
  --course-slug=your-course \
  --course-title="Your Course Title" \
  --kinescope-project-id=PROJECT_ID
```

### Resume Interrupted Processing
```bash
pnpm course:process-transcripts \
  --course-slug=your-course \
  --course-title="Your Course Title" \
  --kinescope-project-id=PROJECT_ID \
  --resume
```

### Process Specific Lessons
```bash
pnpm course:process-transcripts \
  --course-slug=your-course \
  --course-title="Your Course Title" \
  --kinescope-project-id=PROJECT_ID \
  --start-lesson=5 \
  --end-lesson=10
```

## Environment Setup

### Required Environment Variables
```bash
# .env.local
KINESCOPE_API_KEY=your_key_here
OPENAI_API_KEY=your_key_here
NEXT_PUBLIC_SUPABASE_URL=your_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key_here
```

### Verify FFmpeg
```bash
ffmpeg -version
```

## What Happens

1. ✅ Downloads videos from Kinescope (360p)
2. ✅ Extracts audio to MP3 (128kbps)
3. ✅ Chunks large audio files for Whisper API
4. ✅ Transcribes via OpenAI Whisper
5. ✅ Stores in database `lessons.content`
6. ✅ Cleans up temporary files

## Output Location

**Database:** `lessons` table → `content` JSONB field
```json
{
  "transcription": "full text...",
  "transcription_length": 12500,
  "transcription_duration": 850.5,
  "transcription_language": "ru",
  "transcription_source": "openai-whisper-1",
  "transcription_date": "2025-01-15T10:30:00Z"
}
```

**Processing Reports:** `store/{course-slug}/logs/processing_*.json`

## Performance

- **Time:** 3-5 minutes per lesson
- **Cost:** ~$0.006/minute of audio (~$1.10 for 12 lessons)
- **Storage:** ~50 KB per lesson (database)

## Troubleshooting

### FFmpeg Not Found
```bash
brew install ffmpeg  # macOS
```

### Invalid API Key
- Check `.env.local` file
- Verify no extra whitespace
- Regenerate key in Kinescope dashboard

### Download Interrupted
```bash
# Use --resume to continue
pnpm course:process-transcripts ... --resume
```

### Rate Limited
- Script automatically retries with backoff
- Default: ~50 requests/minute for Whisper

## Verification

### Check Transcripts in Database
```sql
SELECT 
  lesson_number,
  title,
  content->>'transcription_length' as length
FROM lessons
WHERE course_id = (SELECT id FROM courses WHERE slug = 'your-course')
ORDER BY lesson_number;
```

### View Sample Transcript
```sql
SELECT 
  lesson_number,
  LEFT(content->>'transcription', 200) as preview
FROM lessons
WHERE course_id = (SELECT id FROM courses WHERE slug = 'your-course')
AND lesson_number = 1;
```

## Help

```bash
pnpm course:process-transcripts --help
```

## Documentation

- **Full Guide:** `TRANSCRIPT_PIPELINE_GUIDE.md`
- **Implementation Details:** `PHASE_1_IMPLEMENTATION_SUMMARY.md`
- **Architecture Design:** Multi-Course Architecture Design (provided)

## Common Patterns

### Process Multiple Courses (Parallel)
```bash
# Terminal 1
pnpm course:process-transcripts --course-slug=course-a ...

# Terminal 2
pnpm course:process-transcripts --course-slug=course-b ...
```

### Batch Processing Strategy
```bash
# Step 1: Process first batch
pnpm course:process-transcripts ... --end-lesson=10

# Step 2: Process second batch
pnpm course:process-transcripts ... --start-lesson=11 --end-lesson=20

# Step 3: Catch any failures
pnpm course:process-transcripts ... --resume
```

## Files Created

### Services
- `lib/services/kinescope.ts` - Kinescope API client
- `lib/services/video-processing.ts` - Video/audio processing
- `lib/services/transcription.ts` - Whisper integration

### Scripts
- `scripts/process-course-transcripts.ts` - Main orchestration

### Tests
- `test/services/kinescope.test.ts` - Unit tests (13 passing)

### Docs
- `TRANSCRIPT_PIPELINE_GUIDE.md` - Complete user guide
- `PHASE_1_IMPLEMENTATION_SUMMARY.md` - Implementation summary
- `QUICK_REFERENCE.md` - This file

## Next Steps

After transcripts are generated:

1. **Generate Default Descriptions** (Phase 2)
   ```bash
   # Future script
   pnpm course:generate-defaults --course-slug=your-course
   ```

2. **Create Personalized Content** (Phase 3)
   - User completes survey
   - System generates personalized descriptions

3. **Deliver to Students** (Phase 4)
   - API endpoint serves content
   - GetCourse integration displays in lessons
