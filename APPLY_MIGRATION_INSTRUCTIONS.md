# 🚀 Инструкция: Применение миграции 003

## ✅ Подготовка завершена!

- ✅ Тестовые профили очищены (12345, 21179358)
- ✅ База готова к применению миграции
- ✅ Скрипт для тестирования создан

## 📝 Шаг 1: Применить миграцию в Supabase Dashboard

### Вариант А: Через Web интерфейс

1. Откройте Supabase Dashboard: https://supabase.com/dashboard/project/zxbyvytanhdopkmoseun
2. Перейдите в **SQL Editor** (иконка </> в левом меню)
3. Нажмите **New query**
4. Скопируйте SQL ниже и вставьте в редактор
5. Нажмите **Run** (или Ctrl/Cmd + Enter)

### SQL для выполнения:

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

-- Verify
SELECT 'Migration 003 applied successfully!' as result;
```

### Вариант Б: Через Supabase CLI (если установлен)

```bash
supabase db push --db-url "postgresql://postgres:YOUR_PASSWORD@db.zxbyvytanhdopkmoseun.supabase.co:5432/postgres" < migrations/003_fix_multi_course_profiles.sql
```

## 📝 Шаг 2: Проверить применение

После выполнения SQL запустите проверку:

```bash
cd /Users/aleksejlomakin/Documents/persona
npx tsx --env-file=.env.local scripts/test-multi-course-survey.ts
```

### Ожидаемый результат:

```
✅ SUCCESS: 2 profiles exist!
   Migration was applied correctly!
   User can have multiple profiles (one per course)

✅ Both courses confirmed:
   - massazh-shvz ✓
   - kinesio2 ✓
```

## 📊 Что произойдёт:

1. **Удалится** старое ограничение unique на `user_identifier`
2. **Добавится** новое ограничение unique на пару `(user_identifier, course_slug)`
3. **Создадутся** 2 тестовых профиля для user_id=12345:
   - Профиль 1: course=massazh-shvz (данные для массажа)
   - Профиль 2: course=kinesio2 (данные для тейпирования)

## ❌ Если что-то пошло не так:

### Ошибка: "column course_slug contains null values"

**Решение:**
```sql
-- Сначала заполните NULL значения
UPDATE profiles SET course_slug = 'massazh-shvz' WHERE course_slug IS NULL;

-- Потом применяйте миграцию
```

### Ошибка: "constraint already exists"

**Решение:** Миграция уже применена! Просто запустите тест:
```bash
npx tsx --env-file=.env.local scripts/test-multi-course-survey.ts
```

## 🎯 После успешного применения:

Система будет работать так:

```
Пользователь заполняет анкету:
└─ URL: ?uid=12345&course=massazh-shvz
   └─ Создаётся/обновляется профиль (12345 + massazh-shvz)

Пользователь заполняет анкету для другого курса:
└─ URL: ?uid=12345&course=kinesio2
   └─ Создаётся НОВЫЙ профиль (12345 + kinesio2)

Итого: У пользователя 2 независимых профиля! ✅
```

## 📞 Обратная связь

После применения миграции напишите результат выполнения теста!
