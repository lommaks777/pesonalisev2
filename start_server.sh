#!/bin/bash

# Скрипт для запуска веб-сервера
echo "🚀 Запуск веб-сервера для системы персонализации курсов"
echo "📁 Рабочая директория: $(pwd)"
echo "🌐 Сервер будет доступен по адресу: http://localhost:8000"
echo ""
echo "📖 Доступные страницы:"
echo "  • http://localhost:8000/view_lesson.php?uid={user_id}&lesson={lesson}&course={course}"
echo "  • http://localhost:8000/view_homework.php?uid={user_id}&lesson={lesson}&course={course}"
echo "  • http://localhost:8000/view_personalized_course.php?uid={user_id}&course={course}"
echo "  • http://localhost:8000/process_survey.php?uid={user_id}&course={course}"
echo ""
echo "🛠️  Для остановки сервера нажмите Ctrl+C"
echo ""

# Проверяем наличие PHP
if ! command -v php &> /dev/null; then
    echo "❌ PHP не найден. Установите PHP для продолжения."
    exit 1
fi

# Проверяем наличие FFmpeg
if ! command -v ffmpeg &> /dev/null; then
    echo "⚠️  FFmpeg не найден. Установите FFmpeg для обработки видео/аудио:"
    echo "   brew install ffmpeg"
    echo ""
fi

# Проверяем конфигурацию
if [ ! -f "config.php" ]; then
    echo "❌ Файл config.php не найден. Создайте его с API ключами."
    exit 1
fi

# Создаем папку store если её нет
if [ ! -d "store" ]; then
    mkdir -p store
    echo "📁 Создана папка store"
fi

# Запускаем сервер
echo "✅ Запуск сервера..."
php -S localhost:8000

















