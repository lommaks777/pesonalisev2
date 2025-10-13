# 🚀 Быстрый старт - Исправленная система

## ✅ Исправленные ошибки

1. **Перемещен файл user_profiles.php** из папки `trash/` в корень проекта
2. **Исправлены ключи API** во всех файлах:
   - `config.php` - добавлен правильный ключ для OpenAI API
   - `process_video.php` - исправлен путь к ключу Whisper API
   - `personalize_course.php` - добавлена функция sanitizeFilename
   - `personalize_lesson_descriptions.php` - исправлен путь к ключу OpenAI API
3. **Добавлены недостающие функции** в файлы обработки

## 🛠️ Готовые команды

### 1. Обработка одного видео
```bash
php process_video.php --url=https://kinescope.io/VIDEO_ID --lesson=1 --course="Название курса" --quality=360p
```

### 2. Персонализация курса
```bash
php personalize_course.php --user=USER_ID --course="Название курса"
```

### 3. Запуск веб-сервера
```bash
php -S localhost:8000
```

### 4. Проверка системы очередей
```bash
php -r "require 'queue_system.php'; print_r(getQueueStats());"
```

## 📊 Тестирование

Все основные компоненты протестированы:
- ✅ Синтаксис PHP файлов
- ✅ Загрузка конфигурации
- ✅ Загрузка модулей API
- ✅ Система очередей
- ✅ Веб-интерфейс

## 🔧 Структура проекта

```
persona/
├── config.php                          # ✅ Исправлен
├── utils.php                           # ✅ Работает
├── user_profiles.php                   # ✅ Перемещен из trash/
├── kinescope_api.php                   # ✅ Работает
├── whisper_api.php                     # ✅ Работает
├── queue_system.php                    # ✅ Работает
├── process_video.php                   # ✅ Исправлен
├── personalize_course.php              # ✅ Исправлен
├── personalize_lesson_descriptions.php # ✅ Исправлен
├── process_survey.php                  # ✅ Работает
├── view_lesson.php                     # ✅ Работает
└── store/                              # Папка для данных
```

## 🎯 Следующие шаги

1. **Настройте API ключи** в `config.php` (если нужно)
2. **Создайте папку store** если её нет: `mkdir -p store`
3. **Запустите обработку видео** с помощью команд выше
4. **Используйте веб-интерфейс** для персонализации курсов

## 🆘 Поддержка

При возникновении проблем:
1. Проверьте права доступа к папке `store/`
2. Убедитесь, что FFmpeg установлен
3. Проверьте API ключи в `config.php`
4. Посмотрите логи в папке `store/`

Система готова к использованию! 🎉


