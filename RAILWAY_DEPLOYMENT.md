# 🚀 Развертывание на Railway

## 📋 Подготовка к развертыванию

### 1. Файлы уже созданы:
- ✅ `railway.json` - конфигурация Railway
- ✅ `index.php` - главная страница
- ✅ `config.php` - обновлен для переменных окружения

### 2. Переменные окружения для Railway:
```env
OPENAI_API_KEY=your_openai_api_key_here
KINESCOPE_API_KEY=your_kinescope_api_key_here
```

## 🚀 Пошаговое развертывание

### Шаг 1: Регистрация на Railway
1. Перейдите на [railway.app](https://railway.app)
2. Зарегистрируйтесь через GitHub
3. Подтвердите email

### Шаг 2: Создание проекта
1. Нажмите "New Project"
2. Выберите "Deploy from GitHub repo"
3. Выберите ваш репозиторий `personalize`
4. Нажмите "Deploy"

### Шаг 3: Настройка переменных окружения
1. В панели Railway перейдите в "Variables"
2. Добавьте переменные:
   - `OPENAI_API_KEY` = ваш ключ OpenAI
   - `KINESCOPE_API_KEY` = ваш ключ Kinescope

### Шаг 4: Настройка домена (опционально)
1. В панели Railway перейдите в "Settings"
2. В разделе "Domains" добавьте ваш домен
3. Настройте DNS записи

## 📁 Структура файлов для Railway

```
/
├── railway.json          # Конфигурация Railway
├── index.php            # Главная страница
├── config.php           # Конфигурация (обновлен)
├── view_shvz_course.php # Главная страница курса
├── survey_form.html     # Форма анкеты
├── select_lesson.php    # Выбор урока
├── personalize_lesson.php # Персонализация
├── process_survey.php   # API обработки анкет
├── store/               # Данные курса
│   └── Массаж ШВЗ/
│       ├── course.json
│       ├── videos/
│       ├── audio/
│       ├── transcripts/
│       └── descriptions/
└── ...
```

## 🔧 Оптимизация для Railway

### Автоматическое удаление видео
- ✅ `process_video_optimized.php` - удаляет видео после извлечения аудио
- ✅ `process_course_optimized.php` - массовая обработка с оптимизацией
- ✅ Экономия места: ~2-5 GB на курс

### Настройки производительности
```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "php -S 0.0.0.0:$PORT",
    "healthcheckPath": "/",
    "healthcheckTimeout": 100
  }
}
```

## 🌐 Доступные URL после развертывания

- **Главная страница**: `https://your-app.railway.app/`
- **Курс**: `https://your-app.railway.app/view_shvz_course.php`
- **Анкета**: `https://your-app.railway.app/survey_form.html`
- **Персонализация**: `https://your-app.railway.app/select_lesson.php`

## 📊 Мониторинг и логи

### Просмотр логов
1. В панели Railway перейдите в "Deployments"
2. Выберите последний деплой
3. Перейдите в "Logs"

### Мониторинг производительности
- Railway автоматически отслеживает:
  - Использование CPU
  - Использование памяти
  - Время ответа
  - Количество запросов

## 🔄 Обновления

### Автоматические деплои
- Railway автоматически развертывает изменения при push в GitHub
- Время развертывания: ~2-3 минуты

### Ручные деплои
1. В панели Railway нажмите "Redeploy"
2. Выберите коммит для развертывания

## 💰 Стоимость

### Railway Pricing
- **Hobby Plan**: $5/месяц
  - 512 MB RAM
  - 1 GB storage
  - Подходит для вашего проекта

### Оптимизация затрат
- ✅ Удаление видеофайлов экономит ~80% места
- ✅ Сжатие аудио до 16kHz
- ✅ Кэширование описаний

## 🛠️ Troubleshooting

### Частые проблемы

1. **Ошибка 500**
   - Проверьте переменные окружения
   - Проверьте логи в Railway

2. **Медленная загрузка**
   - Проверьте размер файлов в `/store`
   - Удалите ненужные видеофайлы

3. **Ошибки API**
   - Проверьте ключи OpenAI и Kinescope
   - Проверьте лимиты API

### Команды для диагностики
```bash
# Проверка размера файлов
du -sh store/*

# Очистка временных файлов
find store/ -name "*.mp4" -delete

# Проверка конфигурации
php -r "require 'config.php'; var_dump(cfg());"
```

## 🎉 Готово!

После развертывания ваша система будет доступна по адресу Railway и готова к использованию!

---
*Обновлено: 6 октября 2025*
