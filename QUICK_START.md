# 🚀 Быстрый старт - Система персонализации курсов

## 📋 Что умеет система

✅ **Скачивание видео** с Kinescope в различных разрешениях (360p, 720p, 1080p)  
✅ **Извлечение аудио** из видео файлов  
✅ **Транскрипция** аудио с помощью OpenAI Whisper  
✅ **Генерация описаний** уроков с помощью GPT-4o-mini  
✅ **Персонализация** контента под профиль пользователя  
✅ **Веб-интерфейс** для анкетирования и просмотра контента  

## 🛠️ Настройка (5 минут)

1. **Установите FFmpeg:**
   ```bash
   brew install ffmpeg
   ```

2. **Настройте API ключи в `config.php`:**
   ```php
   return [
       'apis' => [
           'kinescope' => [
               'api_key' => 'YOUR_KINESCOPE_API_KEY'
           ],
           'openai' => [
               'api_key' => 'YOUR_OPENAI_API_KEY'
           ]
       ]
   ];
   ```

3. **Создайте папку для данных:**
   ```bash
   mkdir -p store
   chmod 755 store
   ```

## 🎬 Обработка одного видео

```bash
php process_video.php --url=https://kinescope.io/202339654 --lesson=1 --course="Массаж ШВЗ" --quality=360p
```

**Результат:**
- Скачивает видео в качестве 360p
- Извлекает аудио
- Транскрибирует с помощью Whisper
- Создает описание урока
- Сохраняет в `store/Массаж ШВЗ/`

## 📚 Массовая обработка курса

1. **Создайте JSON файл со списком видео:**
   ```json
   [
     {
       "url": "https://kinescope.io/202271407",
       "lesson": 1,
       "title": "Введение"
     },
     {
       "url": "https://kinescope.io/5NRs6UHWgMX9RtHqxNGy8j",
       "lesson": 2,
       "title": "Теория. Мышцы"
     }
   ]
   ```

2. **Запустите обработку:**
   ```bash
   php process_course.php --course="Массаж ШВЗ" --videos=example_videos.json --quality=360p
   ```

## 👤 Персонализация курса

```bash
php personalize_course.php --user=user_1234567890_abc12344 --course="Массаж ШВЗ"
```

**Результат:**
- Создает персонализированные описания уроков
- Адаптирует контент под профиль пользователя
- Сохраняет в `store/Массаж ШВЗ/personalize/user_1234567890_abc12344/`

## 🌐 Веб-интерфейс

1. **Запустите сервер:**
   ```bash
   ./start_server.sh
   ```

2. **Откройте в браузере:**
   - **Анкета пользователя:** `http://localhost:8000/process_survey.php?uid=user_123&course=Массаж%20ШВЗ`
   - **Просмотр урока:** `http://localhost:8000/view_lesson.php?uid=user_123&lesson=1&course=Массаж%20ШВЗ`
   - **Домашнее задание:** `http://localhost:8000/view_homework.php?uid=user_123&lesson=1&course=Массаж%20ШВЗ`
   - **Весь курс:** `http://localhost:8000/view_personalized_course.php?uid=user_123&course=Массаж%20ШВЗ`

## 📊 Мониторинг

**Проверьте статус обработки:**
```bash
# Просмотр очереди
php -r "require 'queue_system.php'; print_r(getProcessingQueue());"

# Статистика
php -r "require 'queue_system.php'; print_r(getQueueStats());"
```

## 🔧 Основные команды

| Команда | Описание |
|---------|----------|
| `php process_video.php --url=URL --lesson=N --course="NAME"` | Обработка одного видео |
| `php process_course.php --course="NAME" --videos=FILE` | Массовая обработка |
| `php personalize_course.php --user=ID --course="NAME"` | Персонализация |
| `./start_server.sh` | Запуск веб-сервера |
| `php demo.php` | Демонстрация возможностей |

## 📁 Структура данных

```
store/
├── {course_name}/                    # Папка курса
│   ├── {lesson}-{video_id}.txt       # Транскрипции
│   ├── {lesson}-{video_id}-final.json # Описания уроков
│   └── personalize/                  # Персонализированные описания
│       └── {user_id}/                # Папка пользователя
│           └── {lesson}-{video_id}-{user_id}.json
├── processing_queue.json             # Очередь обработки
├── processing_status.json           # Статусы уроков
└── user_profiles.json              # Профили пользователей
```

## 🚨 Решение проблем

**Ошибка "API ключ не найден":**
- Проверьте `config.php`
- Убедитесь в правильности API ключей

**Ошибка "FFmpeg не найден":**
- Установите FFmpeg: `brew install ffmpeg`
- Проверьте PATH: `which ffmpeg`

**Ошибка "Папка store недоступна":**
- Создайте папку: `mkdir -p store`
- Установите права: `chmod 755 store`

**Ошибка "Видео не скачивается":**
- Проверьте API ключ Kinescope
- Убедитесь в правильности URL видео
- Проверьте интернет-соединение

## 🎯 Примеры использования

### 1. Обработка курса "Массаж ШВЗ"

```bash
# Создайте файл videos.json
echo '[
  {
    "url": "https://kinescope.io/202271407",
    "lesson": 1,
    "title": "Введение"
  },
  {
    "url": "https://kinescope.io/5NRs6UHWgMX9RtHqxNGy8j",
    "lesson": 2,
    "title": "Теория. Мышцы"
  }
]' > videos.json

# Обработайте курс
php process_course.php --course="Массаж ШВЗ" --videos=videos.json --quality=360p

# Персонализируйте для пользователя
php personalize_course.php --user=user_1234567890_abc12344 --course="Массаж ШВЗ"
```

### 2. Веб-интерфейс

```bash
# Запустите сервер
./start_server.sh

# Откройте в браузере
open "http://localhost:8000/process_survey.php?uid=user_123&course=Массаж%20ШВЗ"
```

## 📈 Результат

После выполнения всех шагов у вас будет:

✅ **Автоматически обработанный курс** с транскрипциями и описаниями  
✅ **Персонализированный контент** под каждого пользователя  
✅ **Веб-интерфейс** для изучения курса  
✅ **Система мониторинга** обработки  

## 🆘 Поддержка

- **Документация:** `README.md`
- **Демо:** `php demo.php`
- **Логи:** `store/processing_*.json`
- **Конфигурация:** `config.php`

---

🎉 **Система готова к использованию!**

















