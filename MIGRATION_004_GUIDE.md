# Migration 004: Extract Lesson Fields

## Цель

Извлечь данные из JSONB поля `content` в отдельные колонки для упрощения запросов и улучшения структуры базы данных.

## Добавленные поля в таблицу `lessons`

| Поле | Тип | Описание |
|------|-----|----------|
| `transcription` | TEXT | Полный текст транскрипции урока |
| `kinescope_play_link_id` | TEXT | Короткий ID для плеера Kinescope (например, "qM9um324XRfRxWXKHDhm5c") |
| `kinescope_video_content_id` | TEXT | Полный UUID видео из Kinescope API |

## Итоговая структура данных урока

После применения миграции каждый урок будет содержать:

### Прямые поля таблицы
- ✅ `id` - UUID урока
- ✅ `course_id` - UUID курса
- ✅ `lesson_number` - номер урока (INT)
- ✅ `title` - название урока
- ✅ `transcription` - транскрипция урока (**новое поле**)
- ✅ `default_description` - дефолтное описание (JSONB, миграция 002)
- ✅ `kinescope_play_link_id` - ID плей-линка Kinescope (**новое поле**)
- ✅ `kinescope_video_content_id` - UUID видео Kinescope (**новое поле**)

### Получение названия курса
Название курса (`course_name`) доступно через JOIN:

```sql
SELECT 
  l.lesson_number,
  l.title,
  l.transcription,
  l.default_description,
  l.kinescope_play_link_id,
  l.kinescope_video_content_id,
  c.title as course_name
FROM lessons l
JOIN courses c ON l.course_id = c.id
WHERE l.lesson_number = 1;
```

## Применение миграции

```bash
npx tsx --env-file=.env.local scripts/apply-migration-004.ts
```

## Что делает миграция

1. **Добавляет новые колонки** в таблицу `lessons`
2. **Мигрирует данные** из `content` JSONB:
   - `content->>'transcription'` → `transcription`
   - `content->>'kinescope_play_id'` → `kinescope_play_link_id`
   - `content->>'kinescope_video_id'` → `kinescope_video_content_id`
3. **Добавляет комментарии** к колонкам для документации

## Очистка JSONB (опционально)

По умолчанию миграция НЕ удаляет данные из `content` JSONB. Если вы хотите избежать дублирования данных, раскомментируйте последние строки в миграции:

```sql
UPDATE lessons
SET content = content - 'transcription' - 'kinescope_play_id' - 'kinescope_video_id'
WHERE content IS NOT NULL;
```

## Проверка после применения

```sql
-- Проверить, что новые колонки добавлены
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'lessons'
  AND column_name IN ('transcription', 'kinescope_play_link_id', 'kinescope_video_content_id');

-- Посмотреть данные урока
SELECT 
  lesson_number,
  title,
  transcription IS NOT NULL as has_transcription,
  kinescope_play_link_id,
  kinescope_video_content_id
FROM lessons
WHERE course_id = (SELECT id FROM courses WHERE slug = 'massazh-shvz')
ORDER BY lesson_number
LIMIT 5;
```

## Обновление TypeScript типов

TypeScript типы в `lib/supabase/types.ts` обновлены для включения новых полей:

```typescript
lessons: {
  Row: {
    id: string;
    course_id: string;
    lesson_number: number;
    title: string;
    summary: string | null;
    content: Json | null;
    default_description: Json | null;      // миграция 002
    transcription: string | null;          // миграция 004
    kinescope_play_link_id: string | null; // миграция 004
    kinescope_video_content_id: string | null; // миграция 004
    created_at: string;
  };
  // ... Insert и Update типы также обновлены
}
```

## Откат миграции (если необходимо)

Если потребуется откатить миграцию:

```sql
-- Скопировать данные обратно в content JSONB (если были удалены)
UPDATE lessons
SET content = jsonb_set(
  jsonb_set(
    jsonb_set(
      COALESCE(content, '{}'::jsonb),
      '{transcription}',
      to_jsonb(transcription)
    ),
    '{kinescope_play_id}',
    to_jsonb(kinescope_play_link_id)
  ),
  '{kinescope_video_id}',
  to_jsonb(kinescope_video_content_id)
)
WHERE transcription IS NOT NULL 
   OR kinescope_play_link_id IS NOT NULL 
   OR kinescope_video_content_id IS NOT NULL;

-- Удалить колонки
ALTER TABLE lessons DROP COLUMN IF EXISTS transcription;
ALTER TABLE lessons DROP COLUMN IF EXISTS kinescope_play_link_id;
ALTER TABLE lessons DROP COLUMN IF EXISTS kinescope_video_content_id;
```

## Следующие шаги

После применения миграции:

1. ✅ Обновить код, который обращается к `content->>'transcription'` на использование прямого поля `transcription`
2. ✅ Обновить код, который обращается к `content->>'kinescope_play_id'` на использование `kinescope_play_link_id`
3. ✅ Обновить код, который обращается к `content->>'kinescope_video_id'` на использование `kinescope_video_content_id`
4. ⏳ Заполнить пустые значения транскрипций (если есть)
5. ⏳ Заполнить пустые значения Kinescope video content ID (если нужно)

## Преимущества новой структуры

✅ **Упрощенные запросы**: прямой доступ к полям без JSONB операторов  
✅ **Лучшая производительность**: индексы на TEXT колонках работают эффективнее  
✅ **Ясная схема**: структура данных явно видна в схеме БД  
✅ **TypeScript автодополнение**: IDE знает о полях  
✅ **Миграции данных**: проще добавлять/обновлять данные
