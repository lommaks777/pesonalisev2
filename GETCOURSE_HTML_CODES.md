# 📋 Готовые HTML коды для GetCourse

## 1️⃣ Код анкеты персонализации

### Вставить на первом уроке курса:

```html
<div style="max-width:900px;margin:40px auto;padding:20px;">
  <h2 style="text-align:center;color:#667eea;margin-bottom:20px;">
    🎯 Персонализация вашего курса
  </h2>
  <p style="text-align:center;color:#666;margin-bottom:30px;">
    Заполните короткую анкету, чтобы получить персональные рекомендации в каждом уроке
  </p>
  
  <iframe 
    src="https://pesonalisev2-zxby.vercel.app/survey/iframe?uid={uid}&name={real_name}" 
    style="width:100%;height:1200px;border:0;border-radius:16px;box-shadow:0 10px 40px rgba(102,126,234,0.2);"
    allowtransparency="true">
  </iframe>
  
  <p style="text-align:center;color:#999;margin-top:20px;font-size:14px;">
    💡 Ваши ответы используются только для персонализации уроков
  </p>
</div>
```

---

## 2️⃣ Коды для каждого урока

### Урок 1: Демонстрация

```html
<div id="persona-lesson-1" data-lesson="демонстрация" data-title="1 Урок Демонстрация" style="display:none;margin:30px 0;"></div>

<script>
(async function(){
  const API = "https://pesonalisev2-zxby.vercel.app/api/persona";
  const UID = "{uid}";
  const userId = (/^\d{3,}$/.test(String(UID))) ? String(UID) : "guest";
  const mount = document.getElementById('persona-lesson-1');
  const lesson = mount.getAttribute('data-lesson');
  const title = mount.getAttribute('data-title');

  try {
    const r = await fetch(`${API}/block`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ user_id: userId, lesson: lesson, title: title, flush: false })
    });
    
    const data = await r.json();
    
    if (data && data.ok && data.html) {
      if (!document.querySelector('link[data-persona-styles]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://pesonalisev2-zxby.vercel.app/persona/styles.css';
        link.setAttribute('data-persona-styles', '1');
        document.head.appendChild(link);
      }
      mount.innerHTML = data.html;
      mount.style.display = 'block';
    }
  } catch(e) {
    console.error('Persona block error:', e);
  }
})();
</script>
```

### Урок 2: Постизометрическая релаксация

```html
<div id="persona-lesson-2" data-lesson="постизометрическая" data-title="Что такое постизометрическая релаксация" style="display:none;margin:30px 0;"></div>

<script>
(async function(){
  const API = "https://pesonalisev2-zxby.vercel.app/api/persona";
  const UID = "{uid}";
  const userId = (/^\d{3,}$/.test(String(UID))) ? String(UID) : "guest";
  const mount = document.getElementById('persona-lesson-2');
  const lesson = mount.getAttribute('data-lesson');
  const title = mount.getAttribute('data-title');

  try {
    const r = await fetch(`${API}/block`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ user_id: userId, lesson: lesson, title: title, flush: false })
    });
    
    const data = await r.json();
    
    if (data && data.ok && data.html) {
      if (!document.querySelector('link[data-persona-styles]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://pesonalisev2-zxby.vercel.app/persona/styles.css';
        link.setAttribute('data-persona-styles', '1');
        document.head.appendChild(link);
      }
      mount.innerHTML = data.html;
      mount.style.display = 'block';
    }
  } catch(e) {
    console.error('Persona block error:', e);
  }
})();
</script>
```

### Урок 3: Триггерные точки

```html
<div id="persona-lesson-3" data-lesson="триггерные" data-title="Что такое триггерные точки" style="display:none;margin:30px 0;"></div>

<script>
(async function(){
  const API = "https://pesonalisev2-zxby.vercel.app/api/persona";
  const UID = "{uid}";
  const userId = (/^\d{3,}$/.test(String(UID))) ? String(UID) : "guest";
  const mount = document.getElementById('persona-lesson-3');
  const lesson = mount.getAttribute('data-lesson');
  const title = mount.getAttribute('data-title');

  try {
    const r = await fetch(`${API}/block`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ user_id: userId, lesson: lesson, title: title, flush: false })
    });
    
    const data = await r.json();
    
    if (data && data.ok && data.html) {
      if (!document.querySelector('link[data-persona-styles]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://pesonalisev2-zxby.vercel.app/persona/styles.css';
        link.setAttribute('data-persona-styles', '1');
        document.head.appendChild(link);
      }
      mount.innerHTML = data.html;
      mount.style.display = 'block';
    }
  } catch(e) {
    console.error('Persona block error:', e);
  }
})();
</script>
```

### Урок 4: Мышцы ШВЗ

```html
<div id="persona-lesson-4" data-lesson="мышцы" data-title="ШВЗ Мышцы, с которыми мы будем работать в этом курсе" style="display:none;margin:30px 0;"></div>

<script>
(async function(){
  const API = "https://pesonalisev2-zxby.vercel.app/api/persona";
  const UID = "{uid}";
  const userId = (/^\d{3,}$/.test(String(UID))) ? String(UID) : "guest";
  const mount = document.getElementById('persona-lesson-4');
  const lesson = mount.getAttribute('data-lesson');
  const title = mount.getAttribute('data-title');

  try {
    const r = await fetch(`${API}/block`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ user_id: userId, lesson: lesson, title: title, flush: false })
    });
    
    const data = await r.json();
    
    if (data && data.ok && data.html) {
      if (!document.querySelector('link[data-persona-styles]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://pesonalisev2-zxby.vercel.app/persona/styles.css';
        link.setAttribute('data-persona-styles', '1');
        document.head.appendChild(link);
      }
      mount.innerHTML = data.html;
      mount.style.display = 'block';
    }
  } catch(e) {
    console.error('Persona block error:', e);
  }
})();
</script>
```

### Урок 5: Введение

```html
<div id="persona-lesson-5" data-lesson="введение" data-title="1 Урок введение" style="display:none;margin:30px 0;"></div>

<script>
(async function(){
  const API = "https://pesonalisev2-zxby.vercel.app/api/persona";
  const UID = "{uid}";
  const userId = (/^\d{3,}$/.test(String(UID))) ? String(UID) : "guest";
  const mount = document.getElementById('persona-lesson-5');
  const lesson = mount.getAttribute('data-lesson');
  const title = mount.getAttribute('data-title');

  try {
    const r = await fetch(`${API}/block`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ user_id: userId, lesson: lesson, title: title, flush: false })
    });
    
    const data = await r.json();
    
    if (data && data.ok && data.html) {
      if (!document.querySelector('link[data-persona-styles]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://pesonalisev2-zxby.vercel.app/persona/styles.css';
        link.setAttribute('data-persona-styles', '1');
        document.head.appendChild(link);
      }
      mount.innerHTML = data.html;
      mount.style.display = 'block';
    }
  } catch(e) {
    console.error('Persona block error:', e);
  }
})();
</script>
```

### Урок 6-12: Повторяйте за мной / Демонстрация

**Для остальных уроков используйте тот же шаблон, меняя:**
- `id="persona-lesson-N"` (номер урока)
- `data-lesson="КЛЮЧЕВОЕ_СЛОВО"` (часть названия урока)
- `data-title="ПОЛНОЕ НАЗВАНИЕ"` (полное название урока)

#### Урок 6:
```html
<div id="persona-lesson-6" data-lesson="повторяйте" data-title="1 урок повторяйте за мной" style="display:none;margin:30px 0;"></div>
<!-- + скрипт как выше с getElementById('persona-lesson-6') -->
```

#### Урок 7:
```html
<div id="persona-lesson-7" data-lesson="2 урок" data-title="2 Урок повторяйте за мной" style="display:none;margin:30px 0;"></div>
<!-- + скрипт -->
```

#### Урок 8:
```html
<div id="persona-lesson-8" data-lesson="2 урок демонстрация" data-title="2 урок демонстрация" style="display:none;margin:30px 0;"></div>
<!-- + скрипт -->
```

#### Урок 9:
```html
<div id="persona-lesson-9" data-lesson="3 урок швз" data-title="3 Урок Швз повторяйте за мной" style="display:none;margin:30px 0;"></div>
<!-- + скрипт -->
```

#### Урок 10:
```html
<div id="persona-lesson-10" data-lesson="3 урок демонстрация" data-title="3 урок демонстрация" style="display:none;margin:30px 0;"></div>
<!-- + скрипт -->
```

#### Урок 11:
```html
<div id="persona-lesson-11" data-lesson="4 урок" data-title="4 урок-демонстрация" style="display:none;margin:30px 0;"></div>
<!-- + скрипт -->
```

#### Урок 12:
```html
<div id="persona-lesson-12" data-lesson="диагностика" data-title="Диагностика и фотографирование клиента" style="display:none;margin:30px 0;"></div>
<!-- + скрипт -->
```

---

## 3️⃣ Универсальный шаблон для любого урока

```html
<div id="persona-lesson-X" 
     data-lesson="КЛЮЧЕВОЕ_СЛОВО_ИЗ_НАЗВАНИЯ" 
     data-title="ПОЛНОЕ НАЗВАНИЕ УРОКА" 
     style="display:none;margin:30px 0;">
</div>

<script>
(async function(){
  const API = "https://pesonalisev2-zxby.vercel.app/api/persona";
  const UID = "{uid}";
  const userId = (/^\d{3,}$/.test(String(UID))) ? String(UID) : "guest";
  const mount = document.getElementById('persona-lesson-X'); // ← Изменить ID
  const lesson = mount.getAttribute('data-lesson');
  const title = mount.getAttribute('data-title');

  try {
    const r = await fetch(`${API}/block`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ 
        user_id: userId, 
        lesson: lesson, 
        title: title, 
        flush: false 
      })
    });
    
    const data = await r.json();
    
    if (data && data.ok && data.html) {
      // Подключаем стили (только один раз на странице)
      if (!document.querySelector('link[data-persona-styles]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://pesonalisev2-zxby.vercel.app/persona/styles.css';
        link.setAttribute('data-persona-styles', '1');
        document.head.appendChild(link);
      }
      
      // Показываем блок
      mount.innerHTML = data.html;
      mount.style.display = 'block';
    }
  } catch(e) {
    console.error('Persona block error:', e);
  }
})();
</script>
```

---

## 📌 Инструкция по использованию:

### Шаг 1: Анкета
1. Скопировать код из раздела **1️⃣**
2. Вставить на **первый урок** курса в GetCourse
3. Переменные `{uid}` и `{real_name}` подставятся автоматически

### Шаг 2: Блоки уроков
1. Скопировать нужный код из раздела **2️⃣**
2. Вставить в начало или конец урока в GetCourse
3. Убедиться, что `data-lesson` и `data-title` соответствуют названию урока

### Шаг 3: Проверка
1. Зайти под тестовым студентом
2. Заполнить анкету на первом уроке
3. Проверить, что блоки загружаются на остальных уроках

---

## ⚠️ Важные моменты:

1. **Уникальный ID**: каждый блок должен иметь уникальный `id` (persona-lesson-1, persona-lesson-2, и т.д.)
2. **data-lesson**: должен содержать ЧАСТЬ названия урока (для поиска в БД)
3. **data-title**: ПОЛНОЕ название для отображения студенту
4. **{uid}** и **{real_name}**: GetCourse автоматически подставит значения

---

## ✅ Готово!

Все коды готовы к копированию и вставке в GetCourse! 🚀

