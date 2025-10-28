# Quick Fix: Survey Data Not Loading

## Problem Found
The `/api/persona/block` endpoint was NOT loading the `survey` field from the profiles table, so it couldn't generate personalizations even though the survey exists!

## Fix Applied
Updated line 36-38 in [`app/api/persona/block/route.ts`](file:///Users/aleksejlomakin/Documents/persona/app/api/persona/block/route.ts):

**Before:**
```typescript
.select("id, name, course_id, course_slug")  // ❌ Missing survey!
```

**After:**
```typescript
.select("id, name, course_id, course_slug, survey")  // ✅ Now includes survey
```

Also added detailed logging to help debug future issues.

---

## How to Test

### Step 1: Restart Development Server
```bash
# Stop current server (Ctrl+C in the terminal where it's running)
# Then restart:
pnpm dev
```

### Step 2: Test the API
```bash
curl -X POST http://localhost:3000/api/persona/block \
  -H "Content-Type: application/json" \
  -d '{"user_id":"21179358","lesson":"1","course":"taping-basics"}'
```

### Step 3: Check the Logs
You should now see in the server console:
```
[/api/persona/block] Profile lookup: { user_id: '21179358', found: true, has_survey: true }
[/api/persona/block] Profile details: { id: '...', name: 'Алексей', survey_keys: [...] }
[/api/persona/block] Attempting to generate personalization...
[/api/persona/block] Transcript found, generating with AI...
✅ Loaded transcript for lesson ... from database_content_json (1161 chars)
✅ Generated personalized description for lesson ...
[/api/persona/block] ✅ Personalization generated and saved
```

### Step 4: Open Test Page
```
http://localhost:3000/test-taping-basics-lesson-1-user-21179358.html
```

Click "⚡ Сгенерировать персонализацию" and wait 10-30 seconds.

---

## Expected Result

After the fix and server restart:

1. ✅ Profile loads with survey data
2. ✅ Transcript loads from `content.transcription` 
3. ✅ GPT-4o generates personalization
4. ✅ Saves to database
5. ✅ Returns personalized HTML

**First request:** 10-30 seconds (generation)  
**Subsequent requests:** < 100ms (cached)

---

## Why It Wasn't Working

**Timeline:**
1. User filled out survey ✅
2. Survey saved to `profiles.survey` ✅
3. User opened lesson
4. API loaded profile **WITHOUT** survey field ❌
5. Generation check: `if (profile.survey)` → **false** ❌
6. Returned default template instead

**Now:**
1. User filled out survey ✅
2. Survey saved to `profiles.survey` ✅
3. User opened lesson
4. API loaded profile **WITH** survey field ✅
5. Generation check: `if (profile.survey)` → **true** ✅
6. Generates and returns personalization! 🎉

---

## Important Notes

- **Must restart server** for code changes to take effect
- First generation takes 10-30 seconds (GPT-4o API call)
- Check browser console and server logs for detailed info
- If generation fails, check:
  - OpenAI API key in `.env.local`
  - Network connection
  - API rate limits

---

## Files Modified

1. [`app/api/persona/block/route.ts`](file:///Users/aleksejlomakin/Documents/persona/app/api/persona/block/route.ts) - Added `survey` to SELECT
2. Enhanced logging for better debugging

**Status:** ✅ READY TO TEST (restart server first!)
