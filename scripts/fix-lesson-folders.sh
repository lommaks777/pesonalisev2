#!/bin/bash

# Скрипт для исправления нумерации папок уроков в store/shvz/lessons/
# Номер папки должен соответствовать lesson.number в lesson.json

set -e

LESSONS_DIR="/Users/aleksejlomakin/Documents/persona/store/shvz/lessons"
TEMP_DIR="${LESSONS_DIR}_temp_rename"

echo "🔄 Переименование папок уроков..."
echo ""

# Создаём временную директорию
mkdir -p "$TEMP_DIR"

# План переименования:
# Папка → Новое имя (номер урока)
# 01 → 05
# 02 → 11
# 03 → 04
# 04 → 02 ⭐ (это урок про мышцы!)
# 05 → 01
# 06 → 06 (не меняется)
# 07 → 08
# 08 → 07
# 09 → 10
# 10 → 09
# 11 → 12
# 12 → 03

echo "📋 План переименования:"
echo "  01 → 05 (5 Урок Демонстрация)"
echo "  02 → 11 (Постизометрическая релаксация)"
echo "  03 → 04 (Триггерные точки)"
echo "  04 → 02 ⭐ (Мышцы ШВЗ - ИСПРАВЛЯЕМ!)"
echo "  05 → 01 (Введение)"
echo "  06 → 06 (без изменений)"
echo "  07 → 08 (2 Урок повторяйте за мной)"
echo "  08 → 07 (2 урок демонстрация)"
echo "  09 → 10 (3 Урок повторяйте за мной)"
echo "  10 → 09 (3 урок демонстрация)"
echo "  11 → 12 (4 урок-демонстрация)"
echo "  12 → 03 (Диагностика)"
echo ""

# Шаг 1: Копируем все папки во временную директорию с правильными номерами
echo "📦 Шаг 1: Копирование во временную директорию..."

for old_dir in "$LESSONS_DIR"/*/; do
  old_name=$(basename "$old_dir")
  
  # Читаем номер урока из lesson.json
  lesson_number=$(cat "$old_dir/lesson.json" | grep '"number"' | grep -o '[0-9]*' | head -1)
  
  # Форматируем номер с ведущим нулём
  new_name=$(printf "%02d" "$lesson_number")
  
  echo "  $old_name → $new_name"
  cp -r "$old_dir" "$TEMP_DIR/$new_name"
done

echo ""
echo "✅ Шаг 1 завершён"
echo ""

# Шаг 2: Удаляем старые папки
echo "🗑️  Шаг 2: Удаление старых папок..."
rm -rf "$LESSONS_DIR"/*
echo "✅ Шаг 2 завершён"
echo ""

# Шаг 3: Перемещаем папки из временной директории обратно
echo "📥 Шаг 3: Перемещение папок с правильными номерами..."
mv "$TEMP_DIR"/* "$LESSONS_DIR/"
rmdir "$TEMP_DIR"
echo "✅ Шаг 3 завершён"
echo ""

# Проверка результата
echo "🔍 Проверка результата:"
echo ""
for dir in "$LESSONS_DIR"/*/; do
  dirname=$(basename "$dir")
  number=$(cat "$dir/lesson.json" | grep '"number"' | grep -o '[0-9]*')
  title=$(cat "$dir/lesson.json" | grep '"title"' | cut -d'"' -f4 | head -c 60)
  
  if [ "$dirname" = "$(printf "%02d" "$number")" ]; then
    echo "✅ Папка $dirname = Урок №$number: $title"
  else
    echo "❌ Папка $dirname ≠ Урок №$number: $title"
  fi
done

echo ""
echo "🎉 Готово! Теперь нужно переимпортировать уроки в БД"
echo ""
echo "Запустите:"
echo "  npx tsx --env-file=.env.local scripts/import-lessons.ts"
