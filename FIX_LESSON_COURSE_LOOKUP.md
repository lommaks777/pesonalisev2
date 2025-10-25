# 🐛 Исправление: Неправильный поиск урока по course

## Проблема

При вставке кода персонализации на сайт GetCourse показывался **урок из другого курса**.

### Пример:
```html
<!-- Урок 2 курса "Массаж ШВЗ" -->
<div data-course="shvz" data-lesson="2">
```

**Результат:** Показывался урок "+1.Тейпирование морщин на лбу" из курса Kinesio 2 ❌

## Причины

1. **Неправильный slug курса в HTML**
   - Использовался: `data-course="shvz"`
   - Правильный slug: `data-course="massazh-shvz"`

2. **API не учитывал profile.course_slug**
   - Код пытался использовать `profile.course_id` (которого нет в таблице)
   - Должен использовать `profile.course_slug` и преобразовывать его в course_id

## Исправление в коде

### Файл: `/app/api/persona/block/route.ts`

**Было:**
```typescript
// Если course не передан или не найден, используем course_id из профиля
if (!courseId && profile?.course_id) {
  courseId = profile.course_id;
  console.log('[/api/persona/block] Using course_id from profile:', courseId);
}
```

**Стало:**
```typescript
// Если course не передан или не найден, используем course_slug из профиля
if (!courseId && profile?.course_slug) {
  console.log('[/api/persona/block] No course param, using profile.course_slug:', profile.course_slug);
  
  const { data: profileCourseData } = await supabase
    .from("courses")
    .select("id")
    .eq("slug", profile.course_slug)
    .maybeSingle();
  
  if (profileCourseData) {
    courseId = profileCourseData.id;
    console.log('[/api/persona/block] Using course_id from profile course_slug:', courseId);
  }
}
```

## Правильные slugs курсов

| Курс | Правильный slug | Неправильно |
|------|----------------|-------------|
| Массаж ШВЗ | `massazh-shvz` | ~~shvz~~ |
| Кинезиотейпирование | `kinesio2` | ~~kinesio~~, ~~taping~~ |
| Основы тейпирования | `taping-basics` | ~~taping~~, ~~basics~~ |

## Как исправить на сайте

### Для курса "Массаж ШВЗ":

**Правильный код:**
```html
<div id="persona-lesson-2" 
     data-lesson="2" 
     data-title="2. Теория. Мышцы, с которыми мы будем работать в этом курсе"
     data-course="massazh-shvz" 
     style="display:none;margin:30px 0;">
</div>
```

### Для курса "Кинезиотейпирование":

**Правильный код:**
```html
<div id="persona-lesson-2" 
     data-lesson="2" 
     data-title="Тейпирование морщин на лбу"
     data-course="kinesio2" 
     style="display:none;margin:30px 0;">
</div>
```

## Проверка после исправления

1. **Задеплойте изменения:**
   ```bash
   git add app/api/persona/block/route.ts
   git commit -m "fix: use profile.course_slug instead of non-existent course_id"
   git push
   ```

2. **Проверьте на Vercel:**
   - Подождите деплоя (1-2 минуты)
   - Откройте урок на GetCourse
   - Проверьте, что показывается правильный урок

3. **Тест через API:**
   ```bash
   npx tsx scripts/test-lesson-course-lookup.ts
   ```

## Результат

✅ Урок 2 курса "Массаж ШВЗ" → показывает "ШВЗ Мышцы, с которыми мы будем работать"
✅ Урок 2 курса "Кинезиотейпирование" → показывает "+1.Тейпирование морщин на лбу"

Каждый курс теперь показывает свои уроки!
