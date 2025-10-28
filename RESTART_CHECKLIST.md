# ⚠️ IMPORTANT: Server Restart Required!

## The Problem

The test page shows incorrect data because **the development server is running OLD CODE** that doesn't load the `survey` field.

### What You're Seeing:
```
✅ Статус профиля: Найден (Алексей)
❌ Данные анкеты: Не заполнена  ← WRONG! Survey exists in database
❌ Персонализаций создано: 0 уроков  ← Correct
❌ Транскрипция урока 1: Отсутствует  ← WRONG! Exists in content.transcription
✅ Базовое описание урока 1: Отсутствует  ← WRONG! Exists in database
```

### Why This Happens:
The running server is using OLD code from before I fixed it. Code changes in Next.js require a server restart to take effect.

---

## ✅ FIX: Restart the Server

### Step 1: Stop Current Server
In the terminal where `pnpm dev` is running:
```bash
Press Ctrl+C
```

### Step 2: Restart Server
```bash
pnpm dev
```

### Step 3: Wait for "Ready"
Wait until you see:
```
✓ Ready in XXXms
○ Local: http://localhost:3000
```

### Step 4: Test Again
Open in browser:
```
http://localhost:3000/test-taping-basics-lesson-1-user-21179358.html
```

Click "⚡ Сгенерировать персонализацию"

---

## 📊 What You Should See After Restart

### In Browser Test Page:
```
✅ Статус профиля: Найден (Алексей)
✅ Данные анкеты: Заполнена
❌ Персонализаций создано: 0 уроков (нужно сгенерировать)
✅ Транскрипция урока 1: Есть (content.transcription)
✅ Базовое описание урока 1: Есть
```

### In Server Terminal Logs:
After clicking "Сгенерировать персонализацию":
```
[/api/persona/block] Request: { user_id: '21179358', lesson: '1', ... }
[/api/persona/block] Profile lookup: { user_id: '21179358', found: true, has_survey: true }
[/api/persona/block] Profile details: { id: '...', name: 'Алексей', survey_keys: [...] }
[/api/persona/block] Lesson found: { id: '...', number: 1, title: '1 Введение' }
[/api/persona/block] Personalization found: No
[/api/persona/block] Attempting to generate personalization...
[/api/persona/block] Transcript found, generating with AI...
✅ Loaded transcript for lesson ... from database_content_json (1161 chars)
✅ Generated personalized description for lesson ...
[/api/persona/block] ✅ Personalization generated and saved
```

### Generation Time:
- **First request:** 10-30 seconds (GPT-4o API call)
- **Subsequent requests:** < 100ms (cached from database)

---

## 🔍 How to Verify the Fix

### Before Restart (Current State):
```bash
# Make a test API call
curl -X POST http://localhost:3000/api/persona/block \
  -H "Content-Type: application/json" \
  -d '{"user_id":"21179358","lesson":"1","course":"taping-basics"}'

# Result: Returns default template with "Заполнить анкету" button
```

### After Restart (Should Work):
```bash
# Same API call
curl -X POST http://localhost:3000/api/persona/block \
  -H "Content-Type: application/json" \
  -d '{"user_id":"21179358","lesson":"1","course":"taping-basics"}'

# First call: Takes 10-30 seconds, returns personalized content
# Second call: Instant, returns same personalized content from cache
```

---

## 🐛 If Still Not Working After Restart

### Check 1: Server Logs Show Survey Data
Look for this in terminal:
```
[/api/persona/block] Profile lookup: { ..., has_survey: true }  ← Must be TRUE
```

If `has_survey: false`, the fix didn't apply - check that you restarted the right server.

### Check 2: Run Diagnostic Script
```bash
npx tsx scripts/check-user-21179358.ts
```

Should show:
```
✅ Profile found
   Survey data: EXISTS
   Has transcription (content JSON): YES ✅ (1161 chars)
```

### Check 3: Check Code Was Applied
```bash
grep -A 2 "select(" app/api/persona/block/route.ts | head -3
```

Should show:
```typescript
.select("id, name, course_id, course_slug, survey")  ← survey must be here!
```

---

## 📝 Summary of Changes Made

### File: `app/api/persona/block/route.ts`

**Line 38 - OLD:**
```typescript
.select("id, name, course_id, course_slug")  // ❌ Missing survey!
```

**Line 38 - NEW:**
```typescript
.select("id, name, course_id, course_slug, survey")  // ✅ Includes survey
```

**Lines 39-50 - ADDED:**
```typescript
// Enhanced logging to debug profile loading
console.log('[/api/persona/block] Profile lookup:', {
  user_id,
  found: !!profile,
  has_survey: !!(profile?.survey),
  error: profileError
});
```

**Lines 190-220 - ADDED:**
```typescript
// Auto-generation logic when personalization doesn't exist
if (!personalization && !flush) {
  const transcriptData = await loadLessonTranscript(lessonData.id);
  if (transcriptData && profile.survey) {
    // Generate with GPT-4o and save
    ...
  }
}
```

---

## ✅ Expected Final Result

After server restart and clicking "Сгенерировать персонализацию":

1. ✅ Page loads with correct diagnostic info
2. ✅ Shows "has_survey: true" in server logs
3. ✅ Generates personalization (10-30 seconds)
4. ✅ Saves to database
5. ✅ Shows personalized content with "Алексей"
6. ✅ Future requests are instant

---

## 🆘 Still Having Issues?

Run the detailed diagnostic:
```bash
./scripts/test-after-fix.sh
```

This will:
1. Check if server is running
2. Make a test API call
3. Analyze the response
4. Tell you exactly what's wrong

---

**Bottom line: RESTART THE SERVER! The fix is ready, it just needs a restart to take effect.** 🚀
