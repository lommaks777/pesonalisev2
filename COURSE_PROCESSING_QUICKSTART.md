# Course Processing Quick Start

**3 Simple Steps to Process a Course from Kinescope**

## Step 1: Check Videos

Verify the folder contains videos:

```bash
pnpm course:check-videos "https://app.kinescope.io/video?segment=YOUR_SEGMENT_HERE"
```

Output will show:
- How many videos found
- Video titles and durations
- Full list saved to `kinescope-videos-list.json`

## Step 2: Process the Course

Run the processing pipeline:

```bash
pnpm course:process-from-url \
  --url="https://app.kinescope.io/video?segment=YOUR_SEGMENT_HERE" \
  --course-slug=your-course-slug \
  --course-title="Your Course Title"
```

**Example:**
```bash
pnpm course:process-from-url \
  --url="https://app.kinescope.io/video?segment=eyJwYXJlbnRfaWQiOiI2NTI3MjE0Mi0xNWExLTQ3ZmEtOTAzZS1jNzc5ZjEwMWYxNDkifQ" \
  --course-slug=taping-basics \
  --course-title="Основы тейпирования"
```

This will automatically:
1. ⬇️ Download videos (360p)
2. 🎵 Extract audio
3. 🎤 Transcribe with Whisper
4. 💾 Save to database
5. 🗑️ Clean up temp files

## Step 3: Generate Lesson Templates (Optional)

After transcripts are ready, generate structured lesson descriptions:

```bash
pnpm templates:regenerate
```

---

## Common Options

### Process specific lessons only:
```bash
--start-lesson=5 --end-lesson=10
```

### Resume interrupted processing:
```bash
--resume
```

### Add description:
```bash
--course-description="Full course on kinesiology taping"
```

---

## Requirements

### Environment Variables (.env.local)
```env
KINESCOPE_API_KEY=your_key
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

### System Requirements
- **FFmpeg** installed (`brew install ffmpeg` on macOS)
- **Disk space**: ~500 MB per lesson (temporary)
- **Internet**: For API calls to Kinescope, OpenAI, Supabase

---

## Processing Time Estimates

| Video Duration | Approx. Processing Time |
|----------------|------------------------|
| 5 minutes      | 2-3 minutes            |
| 10 minutes     | 4-6 minutes            |
| 20 minutes     | 8-12 minutes           |

For a 12-lesson course with 10-min videos: **~1 hour total**

---

## Troubleshooting

### Error: "FFmpeg not found"
```bash
brew install ffmpeg
```

### Error: "API key not found"
Check `.env.local` file exists and contains all required keys

### Processing interrupted?
Re-run with `--resume` flag to skip completed lessons

---

## Full Documentation

For advanced usage and troubleshooting, see:
- [`MULTI_COURSE_PROCESSING.md`](./MULTI_COURSE_PROCESSING.md) - Complete guide
- [`scripts/process-course-from-url.ts`](./scripts/process-course-from-url.ts) - Script source code
- [`scripts/process-course-transcripts.ts`](./scripts/process-course-transcripts.ts) - Main pipeline

---

## Next Steps

After processing transcripts:

1. **Generate lesson templates**: `pnpm templates:regenerate`
2. **Test personalization**: Use admin dashboard or API
3. **Integrate with GetCourse**: Use lesson block codes
4. **Monitor**: Check processing reports in `store/{course-slug}/logs/`

---

**Quick Command Reference:**

```bash
# 1. Check videos
pnpm course:check-videos "URL"

# 2. Process course
pnpm course:process-from-url --url="URL" --course-slug=slug --course-title="Title"

# 3. Generate templates
pnpm templates:regenerate
```

That's it! 🚀
