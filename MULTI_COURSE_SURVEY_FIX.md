# 🔧 Исправление: Поддержка нескольких курсов для одного пользователя

## 📋 Проблема

**До исправления:**
- Один пользователь мог иметь только ОДИН профиль
- При заполнении анкеты для второго курса - данные первого курса **перезаписывались**
- Невозможно было иметь разные ответы для разных курсов

**Пример проблемы:**
```
Пользователь 21179358:
- Заполнил анкету для курса "Массаж ШВЗ" ✅
- Заполнил анкету для курса "Кинезиотейпирование" ❌
  → Данные массажа были ПОТЕРЯНЫ!
```

## ✅ Решение

**После исправления:**
- Один пользователь может иметь **НЕСКОЛЬКО профилей** (по одному на курс)
- Уникальный ключ: `(user_identifier + course_slug)`
- При повторном заполнении анкеты для ТОГО ЖЕ курса - данные обновляются
- При заполнении для НОВОГО курса - создается новый профиль

## 🚀 Инструкция по применению

### Шаг 1: Применить миграцию в Supabase

1. Откройте **Supabase Dashboard**: https://supabase.com/dashboard
2. Выберите ваш проект
3. Перейдите в **SQL Editor** (слева в меню)
4. Создайте новый запрос
5. Скопируйте и вставьте SQL из файла [`/migrations/003_fix_multi_course_profiles.sql`](./migrations/003_fix_multi_course_profiles.sql)
6. Нажмите **Run** (или Ctrl+Enter)

**SQL для выполнения:**
```sql
-- Migration 003: Fix multi-course profile support
-- Allow users to have separate profiles for different courses

-- 1. Drop old unique constraint on user_identifier
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_user_identifier_key;

-- 2. Add composite unique constraint on (user_identifier, course_slug)
-- This allows one user to have multiple profiles - one per course
ALTER TABLE profiles 
ADD CONSTRAINT profiles_user_course_unique 
UNIQUE (user_identifier, course_slug);

-- 3. Make course_slug NOT NULL (it's required for the composite key)
ALTER TABLE profiles 
ALTER COLUMN course_slug SET NOT NULL;

-- 4. Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_user_course 
ON profiles(user_identifier, course_slug);

-- 5. Add comment for documentation
COMMENT ON CONSTRAINT profiles_user_course_unique ON profiles IS 
'Each user can have one profile per course. When a user fills out a survey for a new course, a new profile is created. When re-filling for the same course, the existing profile is updated.';
```

### Шаг 2: Проверить результат

После выполнения миграции проверьте:

```sql
-- Проверка ограничений
SELECT 
  conname AS constraint_name,
  contype AS constraint_type,
  pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'profiles'::regclass
  AND conname LIKE '%user%';
```

Должно быть:
```
constraint_name: profiles_user_course_unique
constraint_type: u (unique)
definition: UNIQUE (user_identifier, course_slug)
```

### Шаг 3: Удалить профиль 21179358 (неправильные данные)

Профиль пользователя 21179358 содержит **анкету для массажа**, но привязан к **курсу тейпирования**. Нужно удалить:

```sql
DELETE FROM profiles WHERE user_identifier = '21179358';
```

Это автоматически удалит все связанные персонализации (cascade delete).

## 📊 Примеры использования

### Пример 1: Пользователь заполняет анкеты для двух курсов

```
Пользователь: uid=123456, name="Мария"

1. Заполняет анкету для "Массаж ШВЗ":
   → Создается профиль:
     user_identifier: "123456"
     course_slug: "massazh-shvz"
     name: "Мария"
     survey: { motivation: [...], target_clients: "..." }

2. Заполняет анкету для "Кинезиотейпирование":
   → Создается НОВЫЙ профиль:
     user_identifier: "123456"
     course_slug: "kinesio2"
     name: "Мария"
     survey: { ... другие данные ... }

3. Обновляет анкету для "Массаж ШВЗ":
   → ОБНОВЛЯЕТСЯ существующий профиль (123456 + massazh-shvz)
```

### Пример 2: Вставка анкеты в GetCourse

**Для курса "Массаж ШВЗ":**
```html
<iframe 
  src="https://pesonalisev2-zxby.vercel.app/survey/iframe?uid={uid}&name={real_name}&course=massazh-shvz" 
  style="width:100%;height:1200px;border:0;">
</iframe>
```

**Для курса "Кинезиотейпирование":**
```html
<iframe 
  src="https://pesonalisev2-zxby.vercel.app/survey/iframe?uid={uid}&name={real_name}&course=kinesio2" 
  style="width:100%;height:1200px;border:0;">
</iframe>
```

**Ключевое отличие:** параметр `course=` определяет, какой профиль создается/обновляется!

## 🎯 Как это работает сейчас

### API `/api/survey` (POST)

**Запрос:**
```json
{
  "user_id": "123456",
  "name": "Мария",
  "course": "kinesio2",
  "survey": { ... }
}
```

**Логика:**
1. Ищет профиль по `(user_id=123456 AND course=kinesio2)`
2. Если найден → **обновляет** данные анкеты
3. Если НЕ найден → **создает новый** профиль

### API `/api/persona/block` (POST)

**Запрос:**
```json
{
  "user_id": "123456",
  "lesson": "1",
  "course": "kinesio2"
}
```

**Логика:**
1. Ищет профиль по `(user_id=123456 AND course=kinesio2)`
2. Если найден → возвращает **персонализированный** контент
3. Если НЕ найден → возвращает **стандартный** контент

## 🔍 Проверка работы

### Проверить профили пользователя:

```sql
SELECT 
  user_identifier,
  course_slug,
  name,
  created_at
FROM profiles
WHERE user_identifier = '123456'
ORDER BY created_at DESC;
```

### Проверить персонализации:

```sql
SELECT 
  p.user_identifier,
  p.course_slug,
  p.name,
  COUNT(pld.id) as personalizations_count
FROM profiles p
LEFT JOIN personalized_lesson_descriptions pld ON p.id = pld.profile_id
WHERE p.user_identifier = '123456'
GROUP BY p.id, p.user_identifier, p.course_slug, p.name;
```

## ⚠️ Важные замечания

1. **course_slug обязателен** - каждый профиль ДОЛЖЕН иметь course_slug
2. **Уникальность** - один пользователь может иметь только ОДИН профиль на курс
3. **Каскадное удаление** - при удалении профиля все его персонализации тоже удаляются
4. **Разные анкеты для разных курсов** - в будущем нужно создать разные формы анкет для массажа и тейпирования

## 📝 Следующие шаги

1. ✅ Применить миграцию
2. ✅ Удалить некорректный профиль 21179358
3. 🔲 Создать отдельную форму анкеты для курса тейпирования
4. 🔲 Обновить промпты для GPT с учетом специфики тейпирования
5. 🔲 Протестировать с реальным пользователем курса kinesio2

## 🎉 Результат

После применения:
- ✅ Пользователи могут заполнять анкеты для НЕСКОЛЬКИХ курсов
- ✅ Данные НЕ перезаписываются при переходе на новый курс
- ✅ Персонализация работает корректно для каждого курса отдельно
- ✅ Система готова к масштабированию на новые курсы
