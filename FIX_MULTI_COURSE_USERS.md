# ✅ Fix: Multi-Course Users Personalization

## 🐛 Проблема

Пользователь **469887216 (Полина)** заполнил анкету, но персонализация не работала.

### Диагностика показала:

```
User: 469887216
Profiles found: 2

Profile 1:
  - Course: massazh-shvz (ШВКЗ - массаж шеи)
  - Created: 2025-10-16 
  - Has survey: YES ✅

Profile 2:
  - Course: taping-basics (Тейпирование)  
  - Created: 2025-10-27 (сегодня)
  - Has survey: YES ✅
```

**Запрос:** урок 2 из курса `taping-basics`

**Что происходило:**
1. API искал профиль по `user_identifier = "469887216"`
2. Находил **ПЕРВЫЙ** профиль (для курса `massazh-shvz`)
3. Пытался персонализировать урок тейпирования данными из анкеты для массажа ШВКЗ
4. Результат: базовая версия урока ❌

---

## ✅ Решение

### Изменения в `/app/api/persona/block/route.ts`

**БЫЛО (неправильно):**
```typescript
// Шаг 1: Загружаем профиль
const { data: profile } = await supabase
  .from("profiles")
  .select("id, name, course_slug, survey")
  .eq("user_identifier", user_id)
  .maybeSingle();  // ❌ Берёт первый попавшийся!

// Шаг 2: Определяем курс из параметра
if (course) {
  const { data: courseData } = await supabase
    .from("courses")
    .select("id")
    .eq("slug", course)
    .maybeSingle();
  // ...
}
```

**СТАЛО (правильно):**
```typescript
// Шаг 1: СНАЧАЛА определяем курс
if (course) {
  const { data: courseData } = await supabase
    .from("courses")
    .select("id, slug")
    .eq("slug", course)
    .maybeSingle();
  courseId = courseData.id;
  courseSlug = courseData.slug;
}

// Шаг 2: Загружаем профиль ДЛЯ ЭТОГО КУРСА
if (courseSlug) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, name, course_slug, survey")
    .eq("user_identifier", user_id)
    .eq("course_slug", courseSlug)  // ✅ Фильтр по курсу!
    .maybeSingle();
}
```

---

## 📊 Результат

### До исправления:
```bash
curl -X POST /api/persona/block \
  -d '{"user_id":"469887216","lesson":"2","course":"taping-basics"}'

# Response:
{
  "ok": true,
  "html": "📘 Базовая версия урока ... Заполнить анкету"
}
```

### После исправления:
```bash
curl -X POST /api/persona/block \
  -d '{"user_id":"469887216","lesson":"2","course":"taping-basics"}'

# Response:
{
  "ok": true,
  "html": "... на себе и подруге ... уменьшить отечность ..."
}
```

**Персонализация работает! ✅**

- ✅ Использует правильный профиль (для taping-basics)
- ✅ Применяет данные из анкеты тейпирования
- ✅ Упоминает practice_model: "подруга"
- ✅ Упоминает wow_result: "уменьшить отечность"
- ✅ Учитывает fears: "нанесения вреда"

---

## 🔄 Логика работы

### Сценарий 1: Передан параметр `course`
```typescript
Request: { user_id: "469887216", course: "taping-basics", lesson: "2" }

1. Определяем courseId по slug "taping-basics" ✅
2. Ищем profile WHERE user_id = "469887216" AND course_slug = "taping-basics" ✅
3. Находим правильный профиль с survey для тейпирования ✅
4. Генерируем/возвращаем персонализацию ✅
```

### Сценарий 2: НЕ передан `course`, но есть в профиле
```typescript
Request: { user_id: "123", lesson: "5" }

1. course не передан, ищем профиль без фильтра по курсу
2. Берём profile.course_slug из найденного профиля
3. Определяем courseId по profile.course_slug
4. Генерируем/возвращаем персонализацию
```

### Сценарий 3: Несколько профилей + НЕ передан course
```typescript
Request: { user_id: "469887216", lesson: "2" }

⚠️ ПРОБЛЕМА: Если у пользователя 2+ профиля и course не передан
- .maybeSingle() вернёт ошибку "multiple rows returned"
- Нужно ВСЕГДА передавать course в запросе!
```

---

## 📝 Рекомендации

### Для Frontend/GetCourse:
**ВСЕГДА** передавайте параметр `course` в запросе:

```javascript
// ✅ ПРАВИЛЬНО
fetch('/api/persona/block', {
  method: 'POST',
  body: JSON.stringify({
    user_id: uid,
    lesson: lessonNumber,
    course: "taping-basics"  // ✅ ОБЯЗАТЕЛЬНО!
  })
});

// ❌ НЕПРАВИЛЬНО (если у пользователя несколько курсов)
fetch('/api/persona/block', {
  method: 'POST',
  body: JSON.stringify({
    user_id: uid,
    lesson: lessonNumber
    // course отсутствует ❌
  })
});
```

### Для Database:
Один пользователь может иметь **несколько профилей** для разных курсов:

```sql
-- Правильно: один пользователь, два курса
user_identifier: "469887216"
├── Profile 1: course_slug = "massazh-shvz"
└── Profile 2: course_slug = "taping-basics"

-- Каждый профиль имеет свой survey для своего курса ✅
```

---

## 🐛 Дополнительная проблема: Email вместо имени

### Обнаружено:
```javascript
profile.name = "Meplnvrn@gmail.com"  // ❌ Email вместо имени!
survey.real_name = "Полина"          // ✅ Правильное имя здесь
```

### Временное решение:
Система использует `profile.name` для персонализации, поэтому в тексте появляется email.

### Постоянное решение:
Обновить `profile.name` из `survey.real_name`:

```sql
UPDATE profiles 
SET name = survey->>'real_name'
WHERE user_identifier = '469887216' 
  AND course_slug = 'taping-basics';
```

Или исправить в коде API:
```typescript
const userName = profile.name?.includes('@') 
  ? (profile.survey?.real_name || 'Friend')
  : (profile.name || 'Friend');
```

---

## ✅ Deployment

**Commit:** `b674768 - fix: filter profile by course_slug to handle users with multiple courses`

**Status:** 
- ✅ Локально работает
- ✅ Запушено в GitHub
- ⏳ Vercel деплоит (~2-3 минуты)

**После деплоя:** 
```
https://pesonalisev2-zxby.vercel.app/testlesson.html
```

---

## 🎯 Итог

### Что исправлено:
1. ✅ API теперь фильтрует профили по `course_slug`
2. ✅ Пользователи с несколькими курсами получают правильную персонализацию
3. ✅ Каждый курс использует свой survey
4. ✅ Персонализация генерируется корректно

### Что нужно исправить отдельно:
- ⚠️ Email вместо имени в поле `profile.name` (косметическая проблема)

### Рекомендации:
- ✅ ВСЕГДА передавать параметр `course` в API запросах
- ✅ Проверить все места где вызывается `/api/persona/block`
- ✅ Обновить документацию для интеграции с GetCourse
