# Persona Platform (Next.js 15 + Supabase)

Этот репозиторий переведён на актуальный стек:

- **Next.js 15 (App Router)** + **React 19**
- **Tailwind CSS v4**, компоненты **shadcn/ui**
- **Supabase** (Postgres, Auth, Storage)
- **Vitest** + **Testing Library** для unit-тестов, **Playwright** + **MSW** для E2E
- **pnpm** — пакетный менеджер и lockfile

Все артефакты старой PHP-версии сохранены в каталоге `trash/` (исключён из git, но остаётся локально).

## Быстрый старт

```bash
pnpm install
pnpm dev --port 3210
```

После запуска dev-сервер доступен на `http://localhost:3210/dashboard`.

### Обязательные переменные окружения (`webapp/.env`)

```ini
NEXT_PUBLIC_SUPABASE_URL=https://guzeszmhrfalbvamzxgg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service role key>
SUPABASE_DB_URL=postgresql://postgres:<password>@db.guzeszmhrfalbvamzxgg.supabase.co:5432/postgres
OPENAI_API_KEY=<ключ OpenAI>
COURSE_STORE_PATH=../store/Массаж ШВЗ
```

## Команды

| Скрипт | Назначение |
| --- | --- |
| `pnpm dev --port 3210` | dev-сервер Next.js |
| `pnpm db:migrate` | применить SQL-миграции к Supabase |
| `pnpm db:seed` | импорт уроков, профилей и персонализаций |
| `pnpm test` | unit + env тесты (Vitest) |
| `pnpm exec playwright test` | E2E Smoke (Playwright) |

## Структура

- `webapp/` — новая фронтенд/бэкенд-зона на Next.js
- `webapp/app/(dashboard)/dashboard` — основной UI уроков и персонализаций
- `webapp/scripts/` — миграции и импорт данных в Supabase
- `trash/` — архивированные PHP-скрипты предыдущей версии

## CI / Проверки

- `pnpm test`
- `pnpm exec playwright test`

## Git

Основная ветка: `main`. Перед пушем убедитесь, что локально всё зелёное (`git status`, тесты). При необходимости создавайте отдельные ветки/PR.
# Persona Platform (Next.js 15 + Supabase)

Этот репозиторий переведён на актуальный стек:

- **Next.js 15 (App Router)** + **React 19**
- **Tailwind CSS v4**, компоненты **shadcn/ui**
- **Supabase** (Postgres, Auth, Storage)
- **Vitest** + **Testing Library** для unit-тестов, **Playwright** + **MSW** для E2E
- **pnpm** — пакетный менеджер и lockfile

Все артефакты старой PHP-версии сохранены в каталоге `trash/` (исключён из git, но остаётся локально).

## Быстрый старт

```bash
pnpm install
pnpm dev --port 3210
```

После запуска dev-сервер доступен на `http://localhost:3210/dashboard`.

### Обязательные переменные окружения (`webapp/.env`)

```ini
NEXT_PUBLIC_SUPABASE_URL=https://guzeszmhrfalbvamzxgg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service role key>
SUPABASE_DB_URL=postgresql://postgres:<password>@db.guzeszmhrfalbvamzxgg.supabase.co:5432/postgres
OPENAI_API_KEY=<ключ OpenAI>
COURSE_STORE_PATH=../store/Массаж ШВЗ
```

## Команды

| Скрипт | Назначение |
| --- | --- |
| `pnpm dev --port 3210` | dev-сервер Next.js (Webpack) |
| `pnpm db:migrate` | применить SQL-миграции к Supabase |
| `pnpm db:seed` | импорт уроков, профилей и персонализаций |
| `pnpm test` | unit + env тесты (Vitest) |
| `pnpm exec playwright test` | E2E Smoke (Playwright) |

## Структура

- `webapp/` — новая фронтенд/бэкенд-зона на Next.js
- `webapp/app/(dashboard)/dashboard` — основная страница уроков и персонализаций
- `webapp/scripts/` — миграции и импорт данных в Supabase
- `trash/` — архивированные PHP-скрипты предыдущей версии

## CI / Проверки

- `pnpm test`
- `pnpm exec playwright test`

## Git

Основная ветка: `main`. Перед пушем убедитесь, что локально всё зелёное (`git status`, тесты). При необходимости создавайте тему-пулреквесты.
# Система обработки видео и персонализации курсов

Система для автоматической обработки видео с Kinescope, создания транскрипций, генерации описаний уроков и их персонализации под пользователей.

## 🚀 Основные возможности

- **Скачивание видео** с Kinescope в различных разрешениях (360p, 720p, 1080p)
- **Извлечение аудио** из видео файлов
- **Транскрипция** аудио с помощью OpenAI Whisper
- **Генерация описаний** уроков с помощью GPT-4o-mini
- **Персонализация** контента под профиль пользователя
- **Веб-интерфейс** для анкетирования и просмотра контента

## 📁 Структура проекта

```
persona/
├── config.php                          # Конфигурация API ключей
├── utils.php                           # Утилиты
├── kinescope_api.php                   # API для работы с Kinescope
├── whisper_api.php                     # API для работы с Whisper
├── queue_system.php                    # Система очередей
├── process_video.php                   # Обработка одного видео
├── process_course.php                  # Массовая обработка курса
├── personalize_course.php              # Персонализация курса
├── process_survey.php                  # Обработка анкеты пользователя
├── view_lesson.php                     # Просмотр урока
├── view_homework.php                   # Просмотр домашнего задания
├── view_personalized_course.php        # Просмотр персонализированного курса
├── store/                              # Хранилище данных
│   ├── {course_name}/                  # Папка курса
│   │   ├── {lesson}-{video_id}.txt     # Транскрипции
│   │   ├── {lesson}-{video_id}-final.json # Описания уроков
│   │   └── personalize/                # Персонализированные описания
│   │       └── {user_id}/              # Папка пользователя
│   │           └── {lesson}-{video_id}-{user_id}.json
│   └── user_profiles.json              # Профили пользователей
└── trash/                              # Удаленные файлы
```

## 🛠️ Установка и настройка

1. **Установите зависимости:**
   ```bash
   # PHP с расширениями: curl, json, mbstring
   # FFmpeg для обработки видео/аудио
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

3. **Создайте папки:**
   ```bash
   mkdir -p store
   chmod 755 store
   ```

## 📖 Использование

### 1. Обработка одного видео

```bash
php process_video.php --url=https://kinescope.io/VIDEO_ID --lesson=1 --course="Название курса" --quality=360p
```

**Пример:**
```bash
php process_video.php --url=https://kinescope.io/202339654 --lesson=1 --course="Массаж ШВЗ" --quality=360p
```

### 2. Массовая обработка курса

Создайте JSON файл со списком видео:

```json
[
  {
    "url": "https://kinescope.io/VIDEO_ID_1",
    "lesson": 1,
    "title": "Название урока 1"
  },
  {
    "url": "https://kinescope.io/VIDEO_ID_2", 
    "lesson": 2,
    "title": "Название урока 2"
  }
]
```

Запустите обработку:

```bash
php process_course.php --course="Название курса" --videos=videos.json --quality=360p
```

### 3. Персонализация курса

```bash
php personalize_course.php --user=user_1234567890_abc12344 --course="Массаж ШВЗ"
```

### 4. Веб-интерфейс

Запустите локальный сервер:

```bash
php -S localhost:8000
```

**Доступные страницы:**
- `http://localhost:8000/view_lesson.php?uid={user_id}&lesson={lesson}&course={course}` - Просмотр урока
- `http://localhost:8000/view_homework.php?uid={user_id}&lesson={lesson}&course={course}` - Просмотр домашнего задания
- `http://localhost:8000/view_personalized_course.php?uid={user_id}&course={course}` - Просмотр всего курса
- `http://localhost:8000/process_survey.php?uid={user_id}&course={course}` - Анкета пользователя

## 🔧 API и функции

### KinescopeAPI

- `extractVideoId($url)` - Извлечение ID видео из URL
- `getVideoInfo($videoId)` - Получение информации о видео
- `getVideoDownloadUrl($videoId, $quality)` - Получение ссылки на скачивание
- `downloadVideoWithRetry($url, $file)` - Скачивание видео с повторными попытками

### WhisperAPI

- `extractAudio($videoFile, $audioFile)` - Извлечение аудио из видео
- `transcribe($audioFile)` - Транскрипция аудио
- `compressAudio($audioFile)` - Сжатие аудио
- `splitAudio($audioFile)` - Разделение длинного аудио на части

### QueueSystem

- `addLessonToQueue($lessonData)` - Добавление урока в очередь
- `getProcessingQueue()` - Получение очереди обработки
- `updateLessonStatus($lessonId, $status)` - Обновление статуса урока

## 📊 Форматы данных

### Описание урока (JSON)

```json
{
  "summary_short": "Краткое описание навыка",
  "prev_lessons": "Связь с предыдущими уроками",
  "why_watch": "Польза и мотивация (400-600 знаков)",
  "quick_action": "Быстрое действие (1-2 минуты)",
  "social_share": "Текст для соцсетей",
  "homework_20m": "Домашнее задание (до 20 минут)"
}
```

### Профиль пользователя (JSON)

```json
{
  "name": "Имя пользователя",
  "survey": {
    "experience": "none|self_taught|offline_courses|professional_education",
    "motivation": ["new_profession", "extra_income", "help_family", "health_interest"],
    "target_clients": "Описание целевой аудитории",
    "skills_wanted": "Желаемые навыки",
    "fears": ["technique_fail", "not_enough_practice", "no_clients"],
    "wow_result": "Желаемый результат",
    "practice_model": "Модель для практики"
  }
}
```

## 🚨 Обработка ошибок

Система автоматически обрабатывает:
- Ошибки скачивания видео (повторные попытки)
- Ошибки транскрипции (сжатие и разделение аудио)
- Ошибки API (таймауты и повторные запросы)
- Ошибки персонализации (валидация JSON)

## 📈 Мониторинг

Проверьте статус обработки:

```bash
# Просмотр очереди
php -r "require 'queue_system.php'; print_r(getProcessingQueue());"

# Статистика
php -r "require 'queue_system.php'; print_r(getQueueStats());"
```

## 🔒 Безопасность

- API ключи хранятся в `config.php`
- Пользовательские данные в папке `store/`
- Временные файлы автоматически удаляются
- Валидация всех входных данных

## 📝 Логи

Система ведет логи в:
- `store/processing_queue.json` - Очередь обработки
- `store/processing_status.json` - Статусы уроков
- `store/user_profiles.json` - Профили пользователей

## 🆘 Поддержка

При возникновении проблем:
1. Проверьте API ключи в `config.php`
2. Убедитесь в наличии FFmpeg
3. Проверьте права доступа к папке `store/`
4. Посмотрите логи в `store/`












