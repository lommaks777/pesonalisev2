# 🎓 Настройка интеграции с GetCourse

## 📋 Обзор

Система автоматически персонализирует уроки на основе анкеты студента. Интеграция происходит через:
1. **Анкета** - студент заполняет один раз в iframe
2. **Блок урока** - автоматически подгружается на страницу урока

---

## 1️⃣ Вставка анкеты персонализации

### Код для встраивания в GetCourse:

```html
<iframe 
  src="https://pesonalisev2-zxby.vercel.app/survey/iframe?uid={uid}&name={real_name}" 
  style="width:100%;max-width:900px;height:1200px;border:0;border-radius:12px;overflow:hidden;"
  allowtransparency="true">
</iframe>
```

### Параметры:

- `{uid}` - автоматически подставляется ID студента из GetCourse
- `{real_name}` - автоматически подставляется имя студента

### Как это работает:

1. Студент видит анкету с уже заполненным именем
2. Заполняет остальные поля (мотивация, цели, страхи и т.д.)
3. Нажимает "Создать персональный курс"
4. Система генерирует персонализации для ВСЕХ уроков с помощью AI
5. Студент получает ссылку на dashboard

---

## 2️⃣ Вставка персонализированного урока

### Код для вставки на страницу урока в GetCourse:

```html
<div id="sell-block"
     data-lesson="neck-massage-prone"
     data-title="Шейно-воротниковая зона лёжа на животе"
     style="display:none"></div>

<script>
(async function(){
  const API = "https://pesonalisev2-zxby.vercel.app/api/persona";
  const UID = "{uid}";
  const userId = (/^\d{3,}$/.test(String(UID))) ? String(UID) : "guest";
  const mount = document.getElementById('sell-block');
  const lesson = mount.getAttribute('data-lesson');
  const title  = mount.getAttribute('data-title');

  const r = await fetch(`${API}/block`, {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ 
      user_id: userId, 
      lesson: lesson, 
      title: title, 
      flush: false // true = игнорировать кэш
    })
  });
  
  const data = await r.json();
  
  if (data && data.ok && data.html){
    // Подключаем стили (только один раз)
    if (!document.querySelector('link[data-persona-styles]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet'; 
      link.href = 'https://pesonalisev2-zxby.vercel.app/persona/styles.css';
      link.setAttribute('data-persona-styles','1'); 
      document.head.appendChild(link);
    }
    
    // Вставляем HTML блок
    mount.innerHTML = data.html; 
    mount.style.display='block';
    
    console.log("✅ Persona block loaded:", data);
  } else {
    console.warn("❌ Persona block failed:", data);
  }
})();
</script>
```

### Параметры блока:

Измените эти атрибуты для каждого урока:

```html
data-lesson="neck-massage-prone"    <!-- Часть названия урока для поиска -->
data-title="Название урока"         <!-- Полное название для отображения -->
```

### Примеры для разных уроков:

**Урок 1: Демонстрация**
```html
<div id="sell-block"
     data-lesson="демонстрация"
     data-title="1 Урок Демонстрация"
     style="display:none"></div>
```

**Урок 2: Постизометрическая релаксация**
```html
<div id="sell-block"
     data-lesson="постизометрическая"
     data-title="Что такое постизометрическая релаксация"
     style="display:none"></div>
```

**Урок 3: Триггерные точки**
```html
<div id="sell-block"
     data-lesson="триггерные"
     data-title="Что такое триггерные точки"
     style="display:none"></div>
```

---

## 🎨 Что увидит студент

### Если анкета НЕ заполнена:

Блок покажет:
```
💡 Персонализация недоступна
Заполните анкету, чтобы получить персональные рекомендации для этого урока.
[Заполнить анкету →]
```

### Если анкета заполнена:

Блок покажет:
```
🎯 Название урока
Персонализировано для [Имя студента]

👋 Введение
[Личное обращение к студенту по имени]

🔑 Ключевые моменты
• [Момент 1 с учетом целей студента]
• [Момент 2 с учетом страхов]
• [Момент 3 связанный с ожидаемым результатом]

💡 Практические советы
• [Совет 1 для модели практики]
• [Совет 2 с учетом опыта]

[Мотивирующее сообщение]

📚 Домашнее задание
[Персональное задание]
```

---

## 📊 Сценарий использования

### Шаг 1: Студент покупает курс
- Получает доступ к урокам

### Шаг 2: Первый урок - анкета
- Видит iframe с анкетой
- Заполняет: мотивацию, цели, страхи, ожидания
- Система генерирует персонализации для всех уроков (~30 секунд)

### Шаг 3: Последующие уроки
- На каждом уроке автоматически подгружается персонализированный блок
- Обращение по имени, советы с учетом анкеты

### Шаг 4: Повторное заполнение (опционально)
- Студент может заполнить анкету заново
- Система обновит персонализации

---

## ⚙️ Технические детали

### API Endpoints:

1. **Анкета**: `GET /survey/iframe?uid={uid}&name={name}`
   - Показывает форму анкеты
   - Автоматически подставляет имя
   - Сохраняет uid для привязки

2. **Обработка анкеты**: `POST /api/survey`
   - Принимает данные анкеты
   - Создает/обновляет профиль по uid
   - Генерирует персонализации через OpenAI

3. **Блок урока**: `POST /api/persona/block`
   - Принимает: `user_id`, `lesson`, `title`
   - Возвращает HTML блок
   - Кэшируется в браузере

### База данных:

- **profiles**: хранит анкеты студентов (по `user_identifier` = `{uid}`)
- **personalized_lesson_descriptions**: персонализации для каждого урока
- **lessons**: базовые уроки курса

### AI Генерация:

- **Модель**: GPT-4o-mini
- **Стоимость**: ~$0.01-0.02 за студента
- **Время**: 10-30 секунд на генерацию всех уроков

---

## 🔧 Настройка в GetCourse

### 1. Создать урок "Персонализация курса"
- Добавить iframe с анкетой
- Сделать первым уроком
- Обязательным для прохождения

### 2. На каждом уроке добавить блок
- В начале или конце урока
- Вставить скрипт с правильным `data-lesson`
- Проверить работу

### 3. Проверка
- Зайти под тестовым студентом
- Заполнить анкету
- Проверить, что блоки загружаются на всех уроках

---

## 🐛 Troubleshooting

### Блок не появляется:
1. Проверьте консоль браузера (F12)
2. Убедитесь, что `{uid}` подставляется корректно
3. Проверьте, что студент заполнил анкету

### Персонализация не создается:
1. Проверьте переменную окружения `OPENAI_API_KEY` в Vercel
2. Проверьте баланс OpenAI API
3. Посмотрите логи в Vercel Dashboard

### Стили не применяются:
1. Проверьте, что файл `styles.css` доступен
2. Откройте в браузере: `https://pesonalisev2-zxby.vercel.app/persona/styles.css`
3. Убедитесь, что скрипт подключает стили

---

## 📞 Поддержка

- **Vercel Dashboard**: https://vercel.com/alekseis-projects-dfbbc09c/pesonalisev2-zxby
- **Supabase Dashboard**: https://supabase.com/dashboard/project/guzeszmhrfalbvamzxgg
- **GitHub**: https://github.com/lommaks777/pesonalisev2

---

## ✅ Checklist для запуска

- [ ] Добавить `OPENAI_API_KEY` в Vercel Environment Variables
- [ ] Создать урок "Персонализация" с iframe анкеты
- [ ] Добавить скрипт блока на все уроки
- [ ] Протестировать под тестовым студентом
- [ ] Проверить персонализации на разных уроках
- [ ] Настроить обязательное прохождение анкеты

Готово! 🚀



