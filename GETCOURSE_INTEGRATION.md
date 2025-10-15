# 🎓 Интеграция анкеты персонализации с GetCourse

## Обзор

Система персонализации курсов позволяет студентам заполнить анкету и автоматически получить персонализированные описания для каждого урока с помощью AI.

## 📋 Как это работает

1. **Студент заполняет анкету** в iframe на GetCourse
2. **Система создает профиль** в базе данных
3. **OpenAI генерирует персонализации** для всех уроков курса на основе анкеты
4. **Студент получает ссылку** на персональный dashboard с уроками

## 🔗 URL для встраивания

### Вариант 1: Полная страница с навигацией
```
https://pesonalisev2-zxby.vercel.app/survey
```

### Вариант 2: Чистая форма для iframe (рекомендуется)
```
https://pesonalisev2-zxby.vercel.app/survey/iframe
```

## 📦 Встраивание в GetCourse

### HTML код для встраивания

```html
<iframe 
  src="https://pesonalisev2-zxby.vercel.app/survey/iframe"
  width="100%"
  height="1200"
  frameborder="0"
  style="border: none; border-radius: 12px;"
  title="Анкета персонализации курса"
></iframe>
```

### Адаптивный вариант

```html
<div style="max-width: 900px; margin: 0 auto;">
  <iframe 
    src="https://pesonalisev2-zxby.vercel.app/survey/iframe"
    width="100%"
    height="1200"
    frameborder="0"
    style="border: none; border-radius: 12px;"
    title="Анкета персонализации курса"
  ></iframe>
</div>

<style>
  @media (max-width: 768px) {
    iframe {
      height: 1400px;
    }
  }
</style>
```

## 🔄 Обработка событий от iframe

Анкета отправляет события родительскому окну после успешной отправки:

```javascript
// Слушаем событие завершения анкеты
window.addEventListener('message', function(event) {
  // Проверяем источник сообщения для безопасности
  if (event.origin !== 'https://pesonalisev2-zxby.vercel.app') {
    return;
  }
  
  if (event.data.type === 'SURVEY_COMPLETED') {
    const profileId = event.data.profileId;
    const userIdentifier = event.data.userIdentifier;
    const dashboardUrl = event.data.dashboardUrl;
    
    // Перенаправляем пользователя на dashboard или сохраняем данные
    console.log('Профиль создан:', profileId);
    console.log('Ссылка на уроки:', dashboardUrl);
    
    // Опционально: перенаправить пользователя
    window.location.href = dashboardUrl;
  }
});
```

## 📊 Структура анкеты

### Поля анкеты:

1. **Имя** (обязательное)
   - Тип: текст
   - Используется для персонального обращения в уроках

2. **Курс** (обязательное, автоматически выбран)
   - Значение: `massazh-shvz`

3. **Мотивация** (множественный выбор)
   - Помочь близким
   - Профессиональное развитие
   - Улучшение здоровья
   - Дополнительный доход

4. **Целевые клиенты** (текстовое поле)
   - С кем планирует работать студент

5. **Желаемые навыки** (текстовое поле)
   - Какие навыки хочет освоить

6. **Страхи/опасения** (множественный выбор)
   - Навредить клиенту
   - Неправильная техника
   - Недостаток уверенности
   - Недостаточно времени

7. **Ожидаемый результат** (текстовое поле)
   - Какой результат больше всего впечатлит

8. **Модель для практики** (выпадающий список)
   - Семья
   - Друзья
   - Домашние животные
   - Манекен

## 🤖 AI Персонализация

### Что генерирует AI для каждого урока:

```json
{
  "introduction": "Личное обращение к студенту по имени",
  "key_points": [
    "Ключевые моменты урока с учетом целей студента",
    "Практические советы на основе страхов",
    "Связь с ожидаемым результатом"
  ],
  "practical_tips": [
    "Конкретные советы для модели практики",
    "Рекомендации по технике"
  ],
  "motivation": "Мотивирующее сообщение",
  "homework": "Персональное домашнее задание"
}
```

### Модель AI

- **Модель**: `gpt-4o-mini`
- **Temperature**: 0.7
- **Max tokens**: 800 на урок

## 🔗 Ссылка на персональный курс

После заполнения анкеты студент получает уникальную ссылку:

```
https://pesonalisev2-zxby.vercel.app/dashboard?profileId={UUID}
```

**Важно:** Сохраните эту ссылку для каждого студента!

## 📧 Интеграция с Email-рассылками GetCourse

### Вариант 1: Отправка ссылки после заполнения

После заполнения анкеты отправьте студенту письмо со ссылкой на dashboard:

```
Здравствуйте, {{имя}}!

Ваш персональный курс готов! 🎉

Перейдите по ссылке для доступа к урокам:
https://pesonalisev2-zxby.vercel.app/dashboard?profileId={{profileId}}

Сохраните эту ссылку - она понадобится для доступа к курсу.
```

### Вариант 2: Встроенная кнопка в GetCourse

```html
<a href="https://pesonalisev2-zxby.vercel.app/dashboard?profileId={{profileId}}"
   style="display: inline-block; background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 15px 30px; border-radius: 25px; text-decoration: none; font-weight: 600;">
  Перейти к персональному курсу →
</a>
```

## 🛠️ Настройка переменных окружения

Для работы системы нужны следующие переменные в Vercel:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI (для генерации персонализаций)
OPENAI_API_KEY=your_openai_api_key

# Database (опционально, для миграций)
DATABASE_URL=postgresql://...
```

## 📈 Мониторинг и аналитика

### Проверка созданных профилей

```sql
-- Все профили с анкетами
SELECT 
  id,
  name,
  user_identifier,
  course_slug,
  created_at,
  survey->>'motivation' as motivation
FROM profiles
ORDER BY created_at DESC;
```

### Проверка персонализаций

```sql
-- Количество персонализаций по профилям
SELECT 
  p.name,
  COUNT(pld.id) as personalizations_count
FROM profiles p
LEFT JOIN personalized_lesson_descriptions pld ON p.id = pld.profile_id
GROUP BY p.id, p.name
ORDER BY personalizations_count DESC;
```

## ⚠️ Важные замечания

1. **OpenAI API Key**: Убедитесь, что у вас достаточный баланс API, генерация всех персонализаций стоит ~$0.01-0.02 за студента
2. **Rate Limits**: OpenAI имеет лимиты на количество запросов в минуту
3. **Время обработки**: Генерация всех персонализаций занимает 10-30 секунд в зависимости от количества уроков
4. **Сохранение ссылок**: Студенты должны сохранить ссылку на dashboard, иначе они потеряют доступ

## 🎯 Пример использования

1. Студент открывает страницу курса на GetCourse
2. Видит анкету в iframe
3. Заполняет анкету (2-3 минуты)
4. Нажимает "Создать персональный курс"
5. Ждет 10-30 секунд
6. Получает ссылку на персональный dashboard
7. Переходит по ссылке и видит все уроки с персонализацией

## 🔒 Безопасность

- Анкета работает без авторизации
- Каждый профиль имеет уникальный UUID
- Ссылки на dashboard доступны только тем, у кого есть profileId
- CORS настроен для работы с GetCourse

## 📞 Поддержка

При возникновении проблем проверьте:
1. Логи Vercel: https://vercel.com/alekseis-projects-dfbbc09c/pesonalisev2-zxby/logs
2. Supabase Dashboard: https://supabase.com/dashboard/project/guzeszmhrfalbvamzxgg
3. OpenAI Usage: https://platform.openai.com/usage

## 🚀 Пример встраивания в GetCourse

### Шаг 1: Создайте страницу "Персонализация курса"
### Шаг 2: Добавьте блок HTML
### Шаг 3: Вставьте код iframe
### Шаг 4: Настройте высоту (1200px для десктопа, 1400px для мобильных)
### Шаг 5: Опубликуйте страницу!

Готово! 🎉


