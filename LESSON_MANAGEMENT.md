# 📚 Управление уроками и их порядком

## 🗂️ Где хранятся уроки

### **1. Локальные файлы (основной источник):**
```
/store/shvz/lessons/
├── 01/lesson.json  - Урок 1: Демонстрация
├── 02/lesson.json  - Урок 2: Постизометрическая релаксация  
├── 03/lesson.json  - Урок 3: Триггерные точки
├── 04/lesson.json  - Урок 4: Мышцы ШВЗ
├── 05/lesson.json  - Урок 5: Введение
├── 06/lesson.json  - Урок 6: Повторяйте за мной
├── 07/lesson.json  - Урок 7: 2 Урок повторяйте за мной
├── 08/lesson.json  - Урок 8: 2 урок демонстрация
├── 09/lesson.json  - Урок 9: 3 Урок ШВЗ повторяйте за мной
├── 10/lesson.json  - Урок 10: 3 урок демонстрация
├── 11/lesson.json  - Урок 11: 4 урок-демонстрация
└── 12/lesson.json  - Урок 12: Диагностика и фотографирование
```

### **2. База данных Supabase:**
- Таблица `lessons` - основная информация об уроках
- Поле `lesson_number` - определяет порядок
- Сортировка: `ORDER BY lesson_number ASC`

---

## 📝 Текущий порядок уроков:

| № | Название | Файл |
|---|----------|------|
| 1 | 1 Урок Демонстрация | `/store/shvz/lessons/01/lesson.json` |
| 2 | Что такое постизометрическая релаксация | `/store/shvz/lessons/02/lesson.json` |
| 3 | Что такое триггерные точки | `/store/shvz/lessons/03/lesson.json` |
| 4 | ШВЗ Мышцы, с которыми мы будем работать в этом курсе | `/store/shvz/lessons/04/lesson.json` |
| 5 | 1 Урок введение | `/store/shvz/lessons/05/lesson.json` |
| 6 | 1 урок повторяйте за мной | `/store/shvz/lessons/06/lesson.json` |
| 7 | 2 Урок повторяйте за мной | `/store/shvz/lessons/07/lesson.json` |
| 8 | 2 урок демонстрация | `/store/shvz/lessons/08/lesson.json` |
| 9 | 3 Урок ШВЗ повторяйте за мной | `/store/shvz/lessons/09/lesson.json` |
| 10 | 3 урок демонстрация | `/store/shvz/lessons/10/lesson.json` |
| 11 | 4 урок-демонстрация | `/store/shvz/lessons/11/lesson.json` |
| 12 | Диагностика и фотографирование клиента | `/store/shvz/lessons/12/lesson.json` |

---

## 🔧 Как изменить порядок уроков:

### **Способ 1: Изменить номера в JSON файлах**

1. **Откройте нужный файл урока:**
   ```bash
   /store/shvz/lessons/XX/lesson.json
   ```

2. **Измените поле `number`:**
   ```json
   {
     "number": 3,  // ← Измените номер
     "title": "Название урока",
     "description": "Описание урока",
     "duration": "30 минут",
     "status": "active",
     "created_at": "2024-10-08"
   }
   ```

3. **Переимпортируйте в базу данных:**
   ```bash
   pnpm db:migrate
   ```

### **Способ 2: Прямое изменение в Supabase**

1. **Зайдите в Supabase Dashboard:**
   - URL: https://supabase.com/dashboard
   - Проект: `guzeszmhrfalbvamzxgg`

2. **Откройте таблицу `lessons`:**
   - Table Editor → lessons

3. **Измените поле `lesson_number`:**
   - Нажмите на ячейку с номером урока
   - Введите новый номер
   - Сохраните изменения

### **Способ 3: Через SQL запросы**

```sql
-- Поменять местами уроки 5 и 6
UPDATE lessons SET lesson_number = 999 WHERE lesson_number = 5;
UPDATE lessons SET lesson_number = 5 WHERE lesson_number = 6;
UPDATE lessons SET lesson_number = 6 WHERE lesson_number = 999;
```

---

## 📋 Структура файла урока:

```json
{
  "number": 1,                    // ← Номер урока (порядок)
  "title": "Название урока",       // ← Название для отображения
  "description": "Описание",       // ← Краткое описание
  "duration": "30 минут",          // ← Длительность
  "status": "active",             // ← Статус (active/inactive)
  "created_at": "2024-10-08"      // ← Дата создания
}
```

---

## 🚀 Команды для управления:

### **Импорт уроков в базу:**
```bash
pnpm db:migrate
```

### **Просмотр уроков через API:**
```bash
curl https://pesonalisev2-zxby.vercel.app/api/lessons
```

### **Проверка порядка в базе:**
```sql
SELECT lesson_number, title 
FROM lessons 
ORDER BY lesson_number;
```

---

## ⚠️ Важные моменты:

1. **Номера должны быть уникальными** в рамках одного курса
2. **После изменения** нужно переимпортировать данные
3. **Порядок в GetCourse** определяется полем `lesson_number`
4. **Персонализация** привязана к `lesson_id`, поэтому изменение номеров не сломает связи

---

## 🔗 Полезные ссылки:

- **Supabase Dashboard:** https://supabase.com/dashboard/project/guzeszmhrfalbvamzxgg
- **Таблица lessons:** https://supabase.com/dashboard/project/guzeszmhrfalbvamzxgg/editor/lessons
- **API уроков:** https://pesonalisev2-zxby.vercel.app/api/lessons

---

## 📞 Нужна помощь?

Если нужно изменить порядок уроков, просто скажите:
- Какие уроки поменять местами
- Какой новый порядок нужен
- И я помогу с изменениями!

