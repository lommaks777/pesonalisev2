# Fix Report - User Personalization Issues

**Дата:** 16 октября 2025  
**User ID:** 21179358  

---

## 🔴 Проблемы

### 1. Неправильная ссылка на анкету в базовой версии урока
**Было:** `/survey/iframe`  
**Должно быть:** `https://shkolamasterov.online/pl/teach/control/lesson/view?id=342828951`

### 2. Персонализации не отображаются для пользователя 21179358
**Причина:** Персонализации в БД хранятся в старом формате (5 полей), а код ожидает новый формат (7 полей с emoji)

---

## ✅ Внесенные исправления

### 1. Обновлена ссылка на анкету

**Файл:** [`lib/services/html-formatter.ts`](file://lib/services/html-formatter.ts)

```typescript
// Было:
<a href="/survey/iframe" class="persona-btn-secondary" target="_blank">

// Стало:
<a href="https://shkolamasterov.online/pl/teach/control/lesson/view?id=342828951" 
   class="persona-btn-secondary" target="_blank">
```

### 2. Добавлена автоконвертация форматов персонализаций

**Файл:** [`lib/services/html-formatter.ts`](file://lib/services/html-formatter.ts)

**Функция:** `formatPersonalizedContent()`

Теперь функция:
1. **Автоматически определяет формат** данных (старый или новый)
2. **Конвертирует старый формат в новый** on-the-fly
3. **Поддерживает оба формата** без необходимости миграции данных

**Конвертация старого → нового формата:**

| Старое поле | Новое поле | Преобразование |
|-------------|-----------|----------------|
| `summary_short` | `introduction` | Прямое копирование |
| `why_watch` | `key_points` | Разбивка по строкам (max 6) |
| `quick_action` | `practical_tips` | Обертка в массив |
| `homework_20m` | `homework` | Прямое копирование |
| `social_share` | `motivational_line` | Прямое копирование |
| `prev_lessons` | `equipment_preparation` | Прямое копирование |

---

## 🧪 Тестирование

### Проверка персонализаций в БД

```bash
npx tsx scripts/check-and-fix-user.ts 21179358
```

**Результат:**
```
✅ Profile found:
   ID: 02c3e5ba-4908-4eee-8b56-9161ce2fe85d
   Name: Алексей
   Survey data: Present

📊 Existing personalizations: 12
📚 Total lessons in database: 12

✅ All personalizations already exist!
```

### Проверка формата данных

```bash
npx tsx scripts/inspect-personalization.ts 21179358 1
```

**Результат:**
```
Content keys: [
  'why_watch',
  'homework_20m',
  'prev_lessons',
  'quick_action',
  'social_share',
  'summary_short'
]
```
→ Старый формат обнаружен

### API тест

```bash
curl -X POST http://localhost:3000/api/persona/block \
  -H "Content-Type: application/json" \
  -d '{"user_id":"21179358","lesson":"1","title":"Урок 1"}'
```

**Результат:** ✅ Полный HTML с персонализированным контентом

**Секции в ответе:**
- 👋 Введение
- 🔑 Ключевые моменты
- 💡 Практические советы
- 🧰 Инвентарь и подготовка
- 📚 Домашнее задание
- _Мотивационная строка_

---

## 📁 Созданные утилиты

### 1. `scripts/check-and-fix-user.ts`
Проверяет профиль пользователя и генерирует недостающие персонализации

**Использование:**
```bash
npx tsx scripts/check-and-fix-user.ts <user_id>
```

### 2. `scripts/inspect-personalization.ts`
Показывает структуру данных персонализации для отладки

**Использование:**
```bash
npx tsx scripts/inspect-personalization.ts <user_id> <lesson_number>
```

---

## 🔄 Обратная совместимость

**Важно:** Изменения полностью обратно совместимы!

- ✅ Старые персонализации (5 полей) автоматически конвертируются
- ✅ Новые персонализации (7 полей) работают как раньше
- ✅ Нет необходимости в миграции данных
- ✅ Нет необходимости перегенерировать существующие персонализации

---

## 📊 Статус

### Проблема 1: Ссылка на анкету
- **До:** Вела на `/survey/iframe` (не работает)
- **После:** Ведет на реальную страницу GetCourse ✅

### Проблема 2: Персонализации не отображались
- **До:** Пустой HTML блок
- **После:** Полный персонализированный контент ✅

### Пользователь 21179358
- ✅ Профиль найден
- ✅ Анкета заполнена
- ✅ 12/12 персонализаций в БД
- ✅ Персонализации отображаются корректно

---

## 🚀 Deployment

Изменения готовы к деплою вместе с CORS фиксом:

```bash
git add lib/services/html-formatter.ts
git add scripts/check-and-fix-user.ts
git add scripts/inspect-personalization.ts
git commit -m "fix: survey link and old format personalization compatibility"
git push origin main
```

---

## 📝 Заметки

### Почему старый формат?
Персонализации для пользователя 21179358 были созданы до обновления системы на новый формат с 7 секциями.

### Нужна ли миграция?
**Нет!** Автоматическая конвертация решает проблему без миграции данных. Новые персонализации будут создаваться в новом формате, старые будут работать через конвертацию.

### Производительность
Конвертация выполняется в памяти при рендеринге. Никакого влияния на производительность - это простое преобразование объекта.

---

✅ **Все проблемы решены!**
