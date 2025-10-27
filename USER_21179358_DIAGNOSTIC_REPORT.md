# Diagnostic Report: User 21179358 - Personalization Issues

**Date:** 2025-10-27  
**User ID:** 21179358  
**User Name:** Алексей  
**Course:** taping-basics

## Summary

User 21179358 has completed the survey and has a valid profile in the database, but **personalization is not working** for this user. The root cause has been identified.

---

## Diagnostic Results

### ✅ What's Working

1. **Profile Exists**
   - User ID: `21179358`
   - Name: `Алексей`
   - Course: `taping-basics`
   - Profile ID: `1ccb1f9f-d760-4c2b-bd76-13c9d4839c22`

2. **Survey Data Complete**
   ```json
   {
     "uid": "21179358",
     "real_name": "Алексей",
     "course": "taping-basics",
     "motivation": ["professional_development", "additional_income"],
     "fears": ["harm_client", "wrong_technique"],
     "practice_model": "на маме",
     "target_clients": "офисныим работниками",
     "skills_wanted": "делать женщин более красивыми",
     "wow_result": "устранение морщин у моих клиенток"
   }
   ```

3. **Course Exists**
   - Course ID: `bc345bd7-337e-48c7-8be5-4f312b6b4c29`
   - Slug: `taping-basics`
   - Title: `Основы`

### ❌ What's NOT Working

1. **No Personalized Lessons Generated**
   - Count: `0` personalized lessons
   - The `personalized_lesson_descriptions` table has no entries for this user

2. **❌ CRITICAL ISSUE: Lesson 1 Missing Transcription**
   - Lesson ID: `86f9c6a7-4b43-4beb-a827-ad37a73b3a9b`
   - Lesson Number: `1`
   - Title: `1 Введение`
   - **Transcription:** `NULL` (does not exist!)
   - **Default Description:** `EXISTS` ✅
   
   **This is the root cause!** Without transcription, personalization cannot be generated.

---

## Root Cause Analysis

### Why Personalization Fails

The personalization engine requires a lesson transcription to generate personalized content. Looking at the code in [`lib/services/personalization-engine.ts`](file:///Users/aleksejlomakin/Documents/persona/lib/services/personalization-engine.ts):

```typescript
// Personalization requires transcription
const transcription = lesson.transcription;
if (!transcription) {
  // Falls back to default description
  return generateDefaultHtml(lesson);
}
```

**Current State:**
- Lesson 1 has `transcription = NULL`
- Lesson 1 has `default_description = EXISTS`
- When API is called, it returns the **default (non-personalized) version**

### What Happens When User Requests Lesson

1. User opens lesson 1
2. Frontend calls `/api/persona/block` with `user_id: 21179358`, `lesson: 1`
3. Backend finds profile ✅
4. Backend finds lesson ✅
5. Backend checks for transcription ❌ **MISSING**
6. Backend returns default description (not personalized)
7. User sees generic content without personalization

---

## Solutions

### Option 1: Add Transcription (Recommended)

Add transcription for lesson 1 of taping-basics course:

```bash
# Use the transcription generation script
npx tsx scripts/generate-transcripts-from-urls.ts
```

Or manually add transcription to the database:
```sql
UPDATE lessons 
SET transcription = 'ваша транскрипция здесь...'
WHERE id = '86f9c6a7-4b43-4beb-a827-ad37a73b3a9b';
```

### Option 2: Generate from Video

If the lesson has a Kinescope video link, process it:

```bash
# Check video details
npx tsx scripts/check-kinescope-video-details.ts

# Process video to get transcription
npx tsx scripts/process-course-transcripts.ts
```

### Option 3: Use Existing Template (if available)

Check if there's a template in [`store/taping-basics/templates/`](file:///Users/aleksejlomakin/Documents/persona/store/taping-basics/templates/) that can be used as transcription source.

---

## Testing Files Created

### 1. Test HTML Page
**File:** [`public/test-taping-basics-lesson-1-user-21179358.html`](file:///Users/aleksejlomakin/Documents/persona/public/test-taping-basics-lesson-1-user-21179358.html)

Features:
- ✅ Automatic diagnostic check
- ✅ Shows profile status
- ✅ Shows survey completion
- ✅ Shows transcription status
- ✅ Shows personalization count
- ✅ Test personalization API
- ✅ Generate personalization button
- ✅ Debug information viewer

**How to use:**
1. Start dev server: `npm run dev`
2. Open: `http://localhost:3000/test-taping-basics-lesson-1-user-21179358.html`
3. Click "🔍 Запустить диагностику"
4. Review the diagnostic results
5. Try "🧪 Тест персонализации" to see current behavior

### 2. Diagnostic Script
**File:** [`scripts/check-user-21179358.ts`](file:///Users/aleksejlomakin/Documents/persona/scripts/check-user-21179358.ts)

Run with:
```bash
npx tsx scripts/check-user-21179358.ts
```

Output shows:
- Profile status
- Survey data
- Personalization count
- Lesson transcription status
- Default description status

---

## Expected Behavior After Fix

Once transcription is added to lesson 1:

1. ✅ User profile exists
2. ✅ Survey data complete
3. ✅ Lesson has transcription
4. ✅ Call `/api/persona/block` → Generates personalized content
5. ✅ Content includes:
   - 👋 Персональное приветствие (mentions "Алексей")
   - 🎯 Зачем это вам (references their motivation)
   - 🔑 Ключевые моменты
   - 💡 Практическое применение (mentions "офисным работникам")
   - 😰 Работа с страхами (addresses "wrong_technique", "harm_client")
   - 📚 Персональное ДЗ (adapted for practice "на маме")
   - 💬 Мотивационная цитата

---

## Other Lessons Status

Need to check transcription status for all 28 lessons in taping-basics:

```bash
# Check all lessons in course
npx tsx scripts/check-course-lessons.ts
```

Likely other lessons also missing transcriptions and will need the same fix.

---

## Recommendations

1. **Immediate:** Add transcription for lesson 1
2. **Short-term:** Check and add transcriptions for all lessons in taping-basics
3. **Long-term:** Implement validation to prevent lessons without transcriptions from being assigned to courses
4. **Monitoring:** Add admin dashboard warning for lessons missing transcriptions

---

## Files Reference

**Created/Modified:**
- ✅ [`public/test-taping-basics-lesson-1-user-21179358.html`](file:///Users/aleksejlomakin/Documents/persona/public/test-taping-basics-lesson-1-user-21179358.html) - Test page
- ✅ [`scripts/check-user-21179358.ts`](file:///Users/aleksejlomakin/Documents/persona/scripts/check-user-21179358.ts) - Diagnostic script
- ✅ [`taping-basics-quiz.txt`](file:///Users/aleksejlomakin/Documents/persona/taping-basics-quiz.txt) - Quiz questions (bonus)
- ✅ [`scripts/generate-taping-basics-quiz.ts`](file:///Users/aleksejlomakin/Documents/persona/scripts/generate-taping-basics-quiz.ts) - Quiz generator

**Existing Files to Review:**
- [`lib/services/personalization-engine.ts`](file:///Users/aleksejlomakin/Documents/persona/lib/services/personalization-engine.ts) - Personalization logic
- [`app/api/persona/block/route.ts`](file:///Users/aleksejlomakin/Documents/persona/app/api/persona/block/route.ts) - API endpoint
- [`store/taping-basics/`](file:///Users/aleksejlomakin/Documents/persona/store/taping-basics/) - Course data
