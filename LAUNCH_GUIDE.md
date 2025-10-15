# 🚀 Руководство по запуску системы

## 📋 Быстрый старт (5 минут)

### 1. Проверьте зависимости
```bash
# Проверьте PHP
php --version

# Проверьте FFmpeg
ffmpeg -version

# Если FFmpeg не установлен:
brew install ffmpeg
```

### 2. Настройте API ключи
Отредактируйте файл `config.php`:
```php
<?php
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
?>
```

### 3. Создайте папку для данных
```bash
mkdir -p store
chmod 755 store
```

### 4. Запустите демо
```bash
php demo.php
```

## 🎬 Обработка видео

### Одно видео
```bash
php process_video.php --url=https://kinescope.io/202339654 --lesson=1 --course="Массаж ШВЗ" --quality=360p
```

### Массовая обработка
1. Создайте файл `videos.json`:
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

2. Запустите обработку:
```bash
php process_course.php --course="Массаж ШВЗ" --videos=videos.json --quality=360p
```

## 👤 Персонализация

```bash
php personalize_course.php --user=user_1234567890_abc12344 --course="Массаж ШВЗ"
```

## 🌐 Веб-интерфейс

### Запуск сервера
```bash
./start_server.sh
```

### Доступные страницы
- **Анкета:** `http://localhost:8000/process_survey.php?uid=user_123&course=Массаж%20ШВЗ`
- **Урок:** `http://localhost:8000/view_lesson.php?uid=user_123&lesson=1&course=Массаж%20ШВЗ`
- **Домашка:** `http://localhost:8000/view_homework.php?uid=user_123&lesson=1&course=Массаж%20ШВЗ`
- **Курс:** `http://localhost:8000/view_personalized_course.php?uid=user_123&course=Массаж%20ШВЗ`

## 📊 Мониторинг

### Проверка статуса
```bash
# Очередь обработки
php -r "require 'queue_system.php'; print_r(getProcessingQueue());"

# Статистика
php -r "require 'queue_system.php'; print_r(getQueueStats());"
```

### Логи
- `store/processing_queue.json` - Очередь обработки
- `store/processing_status.json` - Статусы уроков
- `store/user_profiles.json` - Профили пользователей

## 🚨 Решение проблем

### Ошибка "API ключ не найден"
- Проверьте `config.php`
- Убедитесь в правильности API ключей

### Ошибка "FFmpeg не найден"
- Установите FFmpeg: `brew install ffmpeg`
- Проверьте PATH: `which ffmpeg`

### Ошибка "Папка store недоступна"
- Создайте папку: `mkdir -p store`
- Установите права: `chmod 755 store`

### Ошибка "Видео не скачивается"
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
- **Быстрый старт:** `QUICK_START.md`
- **Обзор системы:** `SYSTEM_OVERVIEW.md`
- **Демо:** `php demo.php`
- **Логи:** `store/processing_*.json`
- **Конфигурация:** `config.php`

---

🎉 **Система готова к использованию!**
















