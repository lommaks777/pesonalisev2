# GetCourse Integration - Final Guide

**Дата:** 16 октября 2025  
**Статус:** ✅ Готово к использованию  
**API URL:** `https://pesonalisev2-zxby.vercel.app/api/persona/block`

---

## 📋 Краткая инструкция

### Вставка блока в урок GetCourse

Добавьте этот код в **любой урок** на платформе GetCourse:

```html
<div id="persona-lesson-{LESSON_NUMBER}" 
     data-lesson="{LESSON_NUMBER}" 
     data-title="{LESSON_TITLE}"
     data-course="{COURSE_SLUG}" 
     style="display:none;margin:30px 0;">
</div>

<script>
(async function(){
  const API = "https://pesonalisev2-zxby.vercel.app/api/persona";
  const UID = "{uid}";
  const userId = UID && UID !== "{uid}" ? String(UID) : "guest";
  const mount = document.getElementById('persona-lesson-{LESSON_NUMBER}');
  const lesson = mount.getAttribute('data-lesson');
  const title = mount.getAttribute('data-title');
  const course = mount.getAttribute('data-course');

  try {
    // Загружаем стили один раз
    if (!document.querySelector('link[data-persona-styles]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://pesonalisev2-zxby.vercel.app/persona/styles.css';
      link.setAttribute('data-persona-styles', '1');
      document.head.appendChild(link);
    }

    const r = await fetch(`${API}/block`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ 
        user_id: userId, 
        lesson: lesson,
        title: title,
        course: course, 
        flush: false 
      })
    });
    
    const data = await r.json();
    
    if (data?.ok && data?.html) {
      mount.innerHTML = data.html;
      mount.style.display = 'block';
    } else {
      console.warn('Персонализация недоступна:', data?.error || 'неизвестная ошибка');
    }
  } catch(e) {
    console.error('Persona block error:', e);
  }
})();
</script>
```

### Замените плейсхолдеры:

- `{LESSON_NUMBER}` → номер урока (1, 2, 3, ..., 12)
- `{LESSON_TITLE}` → название урока
- `{COURSE_SLUG}` → слаг курса (`shvz` или `taping-basics`)

---

## 📝 Интеграция анкеты в GetCourse

### Ссылка на анкету с GetCourse

Для автоматической передачи данных пользователя в анкету используйте URL с параметрами:

```
https://pesonalisev2-zxby.vercel.app/survey/iframe?uid={uid}&name={real_name}&course={course_slug}
```

**Параметры:**
- `{uid}` - ID пользователя GetCourse (обязательный)
- `{real_name}` - имя пользователя (обязательный)
- `{course_slug}` - **слаг курса (обязательный)** - определяет для какого курса создается персонализация

**Примеры для разных курсов:**

**Курс "Массаж ШВЗ":**
```
https://pesonalisev2-zxby.vercel.app/survey/iframe?uid={uid}&name={real_name}&course=shvz
```

**Курс "Основы тейпирования":**
```
https://pesonalisev2-zxby.vercel.app/survey/iframe?uid={uid}&name={real_name}&course=taping-basics
```

### Переменные GetCourse:

- `{uid}` — уникальный ID пользователя в GetCourse
- `{real_name}` — имя пользователя (может быть email, поэтому поле редактируемое)  
- `{course_slug}` — слаг курса (указывается вручную для каждого курса)

**Доступные слаги курсов:**
- `shvz` - "Массаж шейно-воротниковой зоны"
- `taping-basics` - "Основы тейпирования"

### Что происходит:

1. **Поле "Имя" предзаполнено** значением из `{real_name}`
2. **Пользователь может отредактировать** имя (если там email)
3. **Система определяет курс** по параметру `course` в URL
4. После отправки анкеты создается профиль с `uid` и персонализированным контентом **для указанного курса**

### Важно:

⚠️ Поле имени **всегда видимо и редактируемо**, потому что GetCourse иногда передает в `{real_name}` email вместо имени.

Пользователь видит подсказку:
> 💡 Проверьте имя — иногда здесь может быть указан email

---

## 🎯 Примеры для конкретных уроков

### Курс "Массаж ШВЗ" (shvz)

**Урок 1:**
```html
<div id="persona-lesson-1" 
     data-lesson="1" 
     data-title="1 Урок введение"
     data-course="shvz" 
     style="display:none;margin:30px 0;">
</div>
```

**Урок 2:**
```html
<div id="persona-lesson-2" 
     data-lesson="2" 
     data-title="ШВЗ Мышцы, с которыми мы будем работать в этом курсе"
     data-course="shvz" 
     style="display:none;margin:30px 0;">
</div>
```

**Урок 5:**
```html
<div id="persona-lesson-5" 
     data-lesson="5" 
     data-title="1 Урок Демонстрация"
     data-course="shvz" 
     style="display:none;margin:30px 0;">
</div>
```

### Курс "Основы тейпирования" (taping-basics)

**Урок 1:**
```html
<div id="persona-lesson-1" 
     data-lesson="1" 
     data-title="Введение в тейпирование"
     data-course="taping-basics" 
     style="display:none;margin:30px 0;">
</div>
```

**Урок 2:**
```html
<div id="persona-lesson-2" 
     data-lesson="2" 
     data-title="Основы техники наложения тейпов"
     data-course="taping-basics" 
     style="display:none;margin:30px 0;">
</div>
```

---

## ⚙️ Как это работает

### 1. **Для пользователей БЕЗ анкеты**

Показывается базовая версия урока из шаблона:
- 👋 Введение
- 🔑 Ключевые моменты  
- 💡 Практические советы
- 📚 Домашнее задание
- **+ Кнопка "Заполнить анкету"** → `https://shkolamasterov.online/pl/teach/control/lesson/view?id=342828951`

### 2. **Для пользователей С анкетой**

Показывается персонализированный контент:
- ✅ Обращение по имени ("Привет, Алексей!")
- ✅ Адаптация под цели пользователя
- ✅ Учет модели практики (с кем практикуется)
- ✅ Фокус на мотивацию пользователя
- ❌ Без кнопки "Заполнить анкету"

---

## 🔧 Технические детали

### API Request

```json
POST https://pesonalisev2-zxby.vercel.app/api/persona/block

{
  "user_id": "21179358",
  "lesson": "2",
  "title": "Урок 2",
  "flush": false
}
```

### API Response (успех)

```json
{
  "ok": true,
  "html": "<div class=\"persona-block\">...</div>",
  "cached": true
}
```

### Поиск урока

API ищет урок по **приоритету**:

1. **По номеру** (`lesson_number`) - если `lesson` это число
2. **По названию** (`title ILIKE %lesson%`) - если не нашли по номеру

**⚠️ ВАЖНО:** Передавайте `lesson` как **номер** (1, 2, 3...), не как полное название!

**Правильно:** ✅
```javascript
{ lesson: "2" }
```

**Неправильно:** ❌
```javascript
{ lesson: "ШВЗ Мышцы, с которыми мы будем работать" }
```

---

## 🧪 Тестирование

### Локальный тест

Откройте: `http://localhost:3000/test-getcourse-block.html`

Эта страница полностью эмулирует GetCourse блок.

### Production тест

1. Откройте урок на GetCourse
2. Откройте DevTools (F12) → Console
3. Проверьте логи:
   - `[Persona] Loading lesson: ...`
   - `[Persona] Response status: 200`
   - `[Persona] ✅ Content loaded`

### Проверка персонализации

**Для пользователя с uid 21179358:**

```bash
curl -X POST https://pesonalisev2-zxby.vercel.app/api/persona/block \
  -H "Content-Type: application/json" \
  -d '{"user_id":"21179358","lesson":"1","title":"Урок 1"}'
```

**Ожидаемый результат:**
- ✅ `"ok": true`
- ✅ HTML содержит "Алексей"
- ❌ HTML НЕ содержит "Базовая версия урока"

---

## 🐛 Troubleshooting

### Проблема: Показывается базовая версия вместо персонализированной

**Возможные причины:**

1. **Неправильный user_id**
   - Проверьте что `{uid}` корректно подставляется GetCourse
   - В консоли должно быть: `userId: "21179358"`, а не `userId: "{uid}"`

2. **Урок не найден**
   - Проверьте что `data-lesson` содержит **номер** урока, не название
   - Правильно: `data-lesson="2"`
   - Неправильно: `data-lesson="ШВЗ Мышцы..."`

3. **Персонализация не создана**
   - Проверьте что пользователь заполнил анкету
   - Проверьте в БД: `SELECT * FROM personalized_lesson_descriptions WHERE profile_id = '...'`

### Проблема: CORS ошибка

```
Access to fetch has been blocked by CORS policy
```

**Решение:** ✅ Уже исправлено! API поддерживает CORS для всех доменов.

Если ошибка осталась:
1. Проверьте что используете **HTTPS** URL: `https://pesonalisev2-zxby.vercel.app`
2. Очистите кеш браузера

### Проблема: Стили не загружаются

**Проверка:**
```javascript
document.querySelector('link[data-persona-styles]')
```

Должен вернуть: `<link rel="stylesheet" href="https://...">`

**Решение:**
- Убедитесь что CSS файл доступен: `https://pesonalisev2-zxby.vercel.app/persona/styles.css`

---

## 📊 Статистика

### Поддерживаемые пользователи

- ✅ Пользователи с заполненной анкетой → персонализированный контент
- ✅ Пользователи без анкеты → базовая версия + призыв заполнить анкету
- ✅ Гостевые пользователи → базовая версия

### Поддерживаемые уроки

- ✅ Уроки 1-12 → полная персонализация

### Форматы данных

- ✅ Старый формат (5 полей) → автоматическая конвертация
- ✅ Новый формат (7 полей) → нативная поддержка

---

## 🚀 Deployment Checklist

Перед использованием на production убедитесь:

- [x] API развернут на Vercel
- [x] CORS настроен правильно
- [x] Все 12 уроков в базе данных
- [x] CSS файл доступен по URL
- [x] Тестовый пользователь (21179358) работает корректно

---

## 📞 Support

**Логи сервера:**
```bash
vercel logs --follow
```

**Проверка API:**
```bash
curl -i https://pesonalisev2-zxby.vercel.app/api/persona/block \
  -X OPTIONS
```

Должен вернуть:
```
HTTP/1.1 200 OK
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
```

---

## ✅ Финальный чеклист

- [x] Код блока готов
- [x] API работает
- [x] CORS настроен
- [x] Персонализация работает для uid 21179358
- [x] Базовая версия показывает правильную ссылку на анкету
- [x] Поиск урока по номеру работает корректно
- [x] Тестовые страницы созданы
- [x] Документация готова

**Статус: 🎉 Готово к использованию в production!**
