# 📝 API для персонализации уроков

## Обзор

API предоставляет функциональность для создания, обновления и удаления персонализированных описаний уроков для профилей пользователей.

## Endpoints

### 1. Создание/Обновление персонализации

**POST** `/api/personalizations`

Создает новую или обновляет существующую персонализацию урока для профиля.

#### Request Body

```json
{
  "profileId": "uuid",
  "lessonId": "uuid",
  "content": {
    "introduction": "Добро пожаловать на урок...",
    "key_points": ["Пункт 1", "Пункт 2", "Пункт 3"],
    "homework": "Выполните упражнения...",
    "custom_field": "Любое значение"
  }
}
```

#### Response (Success)

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "profile_id": "uuid",
    "lesson_id": "uuid",
    "content": { ... },
    "created_at": "2025-10-13T10:00:00Z"
  },
  "message": "Персонализация создана"
}
```

#### Response (Error)

```json
{
  "error": "Missing required fields: profileId, lessonId, content"
}
```

### 2. Удаление персонализации

**DELETE** `/api/personalizations`

Удаляет персонализированное описание урока.

#### Request Body

```json
{
  "profileId": "uuid",
  "lessonId": "uuid"
}
```

#### Response (Success)

```json
{
  "success": true,
  "message": "Персонализация удалена"
}
```

## Примеры использования

### JavaScript/TypeScript

```typescript
// Создание персонализации
async function createPersonalization(profileId: string, lessonId: string, content: object) {
  const response = await fetch('/api/personalizations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      profileId,
      lessonId,
      content,
    }),
  });
  
  return await response.json();
}

// Пример использования
const result = await createPersonalization(
  'a954c858-888d-4e68-b1cd-5d0b2943d207',
  '123e4567-e89b-12d3-a456-426614174000',
  {
    introduction: 'Здравствуйте! Этот урок специально адаптирован для вас.',
    key_points: [
      'Учитывая вашу профессию, обратите внимание на...',
      'С учетом вашего опыта, рекомендуем...',
    ],
    homework: 'Выполните упражнения, которые подходят именно вам.',
  }
);
```

### cURL

```bash
# Создание персонализации
curl -X POST https://pesonalisev2-zxby.vercel.app/api/personalizations \
  -H "Content-Type: application/json" \
  -d '{
    "profileId": "a954c858-888d-4e68-b1cd-5d0b2943d207",
    "lessonId": "123e4567-e89b-12d3-a456-426614174000",
    "content": {
      "introduction": "Персонализированное введение",
      "key_points": ["Пункт 1", "Пункт 2"]
    }
  }'

# Удаление персонализации
curl -X DELETE https://pesonalisev2-zxby.vercel.app/api/personalizations \
  -H "Content-Type: application/json" \
  -d '{
    "profileId": "a954c858-888d-4e68-b1cd-5d0b2943d207",
    "lessonId": "123e4567-e89b-12d3-a456-426614174000"
  }'
```

## Структура данных

### Profile (Профиль пользователя)

```typescript
interface Profile {
  id: string;
  user_identifier: string;
  name: string | null;
  course_slug: string | null;
  survey: {
    age?: number;
    profession?: string;
    experience?: string;
    goals?: string[];
    [key: string]: unknown;
  } | null;
  created_at: string;
}
```

### Personalized Lesson Description

```typescript
interface PersonalizedLessonDescription {
  id: string;
  profile_id: string;
  lesson_id: string;
  content: {
    // Любая структура данных
    introduction?: string;
    key_points?: string[];
    homework?: string;
    video_notes?: string;
    [key: string]: unknown;
  };
  created_at: string;
}
```

## UI компоненты

### 1. Просмотр анкеты профиля

```tsx
import { ProfileSurvey } from '@/components/profiles/profile-survey';

<ProfileSurvey 
  survey={profile.survey} 
  profileName={profile.name}
/>
```

### 2. Редактор персонализации

```tsx
import { PersonalizationEditor } from '@/components/personalizations/personalization-editor';

<PersonalizationEditor
  profileId="uuid"
  lessonId="uuid"
  lessonTitle="Урок 1: Введение"
  initialContent={existingContent}
  onSave={() => console.log('Saved!')}
/>
```

## Управление персонализацией через UI

1. **Перейдите на Dashboard**: https://pesonalisev2-zxby.vercel.app/dashboard
2. **Выберите профиль** в боковой панели
3. **Нажмите "Управление персонализацией →"** под профилем
4. **Редактируйте JSON** для каждого урока
5. **Сохраните изменения**

## Примеры персонализированного контента

### Пример 1: Простая структура

```json
{
  "greeting": "Здравствуйте, Алексей!",
  "intro": "С учетом вашего опыта в массаже, этот урок будет особенно полезен.",
  "tips": [
    "Обратите внимание на технику работы с триггерными точками",
    "Используйте знания анатомии для лучшего понимания"
  ]
}
```

### Пример 2: Расширенная структура

```json
{
  "introduction": "Добро пожаловать на урок постизометрической релаксации!",
  "personalized_notes": {
    "based_on_experience": "Вы указали, что имеете опыт работы с клиентами. Этот урок поможет систематизировать ваши знания.",
    "based_on_goals": "Ваша цель - освоить технику ШВЗ. Мы начнем с основ."
  },
  "key_concepts": [
    "Понятие постизометрической релаксации",
    "Механизм действия на мышечные волокна",
    "Практическое применение"
  ],
  "homework": {
    "theory": "Изучите дополнительные материалы по анатомии",
    "practice": "Попрактикуйтесь на добровольце 10-15 минут"
  },
  "next_steps": "В следующем уроке мы перейдем к триггерным точкам"
}
```

## Лучшие практики

1. **Валидируйте JSON** перед отправкой
2. **Используйте осмысленные ключи** (introduction, key_points, homework)
3. **Структурируйте данные** логически
4. **Добавляйте контекст** на основе анкеты пользователя
5. **Обрабатывайте ошибки** на клиенте

## База данных

Персонализации хранятся в таблице `personalized_lesson_descriptions`:

- `id` - UUID персонализации
- `profile_id` - UUID профиля пользователя
- `lesson_id` - UUID урока
- `content` - JSON с персонализированным контентом
- `created_at` - Дата создания

**Уникальный индекс**: `(profile_id, lesson_id)` - один профиль может иметь только одну персонализацию на урок.


