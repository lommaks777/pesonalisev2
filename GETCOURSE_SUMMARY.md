# 🎯 GetCourse Integration - Краткая инструкция

## ✅ Что реализовано:

### 1. **Анкета персонализации с автоподстановкой**
- URL: `https://pesonalisev2-zxby.vercel.app/survey/iframe?uid={uid}&name={real_name}`
- Имя автоматически подставляется из GetCourse
- UID используется как идентификатор пользователя
- При повторном заполнении - обновляет существующий профиль

### 2. **API генерации блоков уроков**
- Endpoint: `POST /api/persona/block`
- Возвращает HTML с персонализированным содержимым
- Автоматически ищет урок по названию
- Показывает приглашение заполнить анкету, если не заполнена

### 3. **Стили для блоков**
- URL: `https://pesonalisev2-zxby.vercel.app/persona/styles.css`
- Красивый градиентный дизайн
- Адаптивная верстка

---

## 📋 Код для GetCourse

### Анкета (вставить на первом уроке):

```html
<iframe 
  src="https://pesonalisev2-zxby.vercel.app/survey/iframe?uid={uid}&name={real_name}" 
  style="width:100%;max-width:900px;height:1200px;border:0;border-radius:12px;overflow:hidden;"
  allowtransparency="true">
</iframe>
```

### Блок урока (вставить на каждом уроке):

```html
<div id="sell-block"
     data-lesson="ЧАСТЬ_НАЗВАНИЯ_УРОКА"
     data-title="ПОЛНОЕ НАЗВАНИЕ УРОКА"
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
    body: JSON.stringify({ user_id: userId, lesson: lesson, title: title, flush: false })
  });
  
  const data = await r.json();
  
  if (data && data.ok && data.html){
    if (!document.querySelector('link[data-persona-styles]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet'; 
      link.href = 'https://pesonalisev2-zxby.vercel.app/persona/styles.css';
      link.setAttribute('data-persona-styles','1'); 
      document.head.appendChild(link);
    }
    mount.innerHTML = data.html; 
    mount.style.display='block';
  }
})();
</script>
```

---

## 🔄 Как работает система:

1. **Студент покупает курс** → получает доступ
2. **Первый урок - анкета**:
   - Имя уже заполнено автоматически
   - Заполняет мотивацию, цели, страхи
   - Нажимает "Создать персональный курс"
   - **AI генерирует персонализации для ВСЕХ 12 уроков** (~30 секунд)
3. **Каждый урок**:
   - Скрипт автоматически загружает персонализированный блок
   - Показывает: личное обращение, советы с учетом анкеты, мотивацию

---

## 📝 Примеры настройки для разных уроков:

### Урок 1:
```html
data-lesson="демонстрация"
data-title="1 Урок Демонстрация"
```

### Урок 2:
```html
data-lesson="постизометрическая"
data-title="Что такое постизометрическая релаксация"
```

### Урок 3:
```html
data-lesson="триггерные"
data-title="Что такое триггерные точки"
```

### Урок 4:
```html
data-lesson="мышцы"
data-title="ШВЗ Мышцы, с которыми мы будем работать"
```

---

## ⚙️ Требования:

- ✅ `OPENAI_API_KEY` в Vercel (уже настроен)
- ✅ Supabase (уже настроен)
- ✅ GetCourse переменные `{uid}` и `{real_name}`

---

## 📚 Подробная документация:

См. файл **GETCOURSE_SETUP.md** для полной инструкции.

---

## 🚀 Готово к использованию!

Все компоненты задеплоены и работают на production.



