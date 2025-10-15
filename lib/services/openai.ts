import OpenAI from "openai";

// Singleton OpenAI client
let openaiClient: OpenAI | null = null;

/**
 * Returns singleton OpenAI instance
 */
export function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

// New 7-section personalized content structure
export interface PersonalizedContent {
  introduction: string;
  key_points: string[];
  practical_tips: string[];
  important_notes?: string[];
  equipment_preparation?: string;
  homework: string;
  motivational_line: string;
}

// Legacy 5-field structure (for backward compatibility)
export interface LegacyPersonalizedContent {
  summary_short: string;
  why_watch: string;
  quick_action: string;
  social_share: string;
  homework_20m: string;
  prev_lessons?: string;
}

export interface SurveyData {
  motivation?: string[];
  target_clients?: string;
  skills_wanted?: string;
  fears?: string[];
  wow_result?: string;
  practice_model?: string;
}

export interface LessonInfo {
  lesson_number: number;
  title: string;
  summary?: string | null;
}

/**
 * Personalization prompt template for new 7-section structure
 */
function createPersonalizationPrompt(
  template: any,
  survey: SurveyData,
  userName: string
): string {
  return `Ты - опытный преподаватель массажа Анастасия Фомина. Персонализируй готовый шаблон урока на основе анкеты студента.

ШАБЛОН УРОКА:
${JSON.stringify(template, null, 2)}

АНКЕТА СТУДЕНТА:
- Имя: ${userName}
- Мотивация: ${survey.motivation?.join(", ") || "не указано"}
- Целевые клиенты: ${survey.target_clients || "не указано"}
- Желаемые навыки: ${survey.skills_wanted || "не указано"}
- Страхи/опасения: ${survey.fears?.join(", ") || "не указано"}
- Ожидаемый результат: ${survey.wow_result || "не указано"}
- Модель для практики: ${survey.practice_model || "не указано"}

ЗАДАНИЕ:
Персонализируй каждый раздел шаблона под этого студента:

1. **introduction** (Введение):
   - Обращайся к студенту по имени
   - Укажи цель урока и связь с их ожидаемым результатом
   - 2-3 предложения

2. **key_points** (Ключевые моменты):
   - Массив из 4-6 пунктов
   - Каждый пункт ≤18 слов
   - Формат: "узнаете/научитесь/поймёте..."
   - Адаптируй примеры под целевых клиентов студента

3. **practical_tips** (Практические советы):
   - Массив из 3-5 пунктов-инструкций
   - Каждый начинается с глагола ("Делайте", "Избегайте", "Следите")
   - Добавь советы с учётом страхов и опасений студента

4. **important_notes** (Важно) - ОПЦИОНАЛЬНЫЙ:
   - Массив из 2-4 пунктов
   - Включай только если в шаблоне есть противопоказания/ограничения
   - Подчеркни моменты, связанные со страхами студента

5. **equipment_preparation** (Инвентарь и подготовка) - ОПЦИОНАЛЬНЫЙ:
   - Строка с описанием оборудования
   - Адаптируй под модель практики студента (дом/студия/мобильный)
   - Включай только если в шаблоне есть эта информация

6. **homework** (Домашнее задание):
   - 1-2 предложения с конкретным действием
   - Адаптируй сложность под опыт студента
   - Учитывай модель для практики

7. **motivational_line** (Мотивационная строка):
   - 1 предложение
   - Свяжи с ожидаемым результатом студента (wow_result)
   - Вдохновляющий тон, без пафоса

ТРЕБОВАНИЯ:
- Сохраняй структуру массивов для key_points, practical_tips, important_notes
- Если в шаблоне нет important_notes или equipment_preparation - не добавляй их
- Все тексты на русском языке
- Обращение на "вы"
- Ясный, дружелюбный язык (уровень B1-B2)

ФОРМАТ ОТВЕТА (JSON):
{
  "introduction": "строка",
  "key_points": ["пункт 1", "пункт 2", ...],
  "practical_tips": ["совет 1", "совет 2", ...],
  "important_notes": ["примечание 1", ...] // опционально
  "equipment_preparation": "строка", // опционально
  "homework": "строка",
  "motivational_line": "строка"
}

Отвечай ТОЛЬКО валидным JSON, без дополнительного текста.`;
}

/**
 * Core personalization logic with error handling
 * Returns personalized content or fallback to original template on error
 */
export async function personalizeLesson(
  template: any,
  survey: SurveyData,
  userName: string,
  lessonInfo: LessonInfo
): Promise<PersonalizedContent> {
  const openai = getOpenAIClient();

  // Fallback template structure with new 7-section format
  const fallbackTemplate: PersonalizedContent = {
    introduction: template.introduction || template["👋 Введение"] || `Урок ${lessonInfo.lesson_number}: ${lessonInfo.title}`,
    key_points: template.key_points || template["🔑 Ключевые моменты"] || [
      "Узнаете основные техники массажа",
      "Научитесь работать с клиентами",
      "Поймёте критерии эффективности",
      "Освоите безопасные приёмы"
    ],
    practical_tips: template.practical_tips || template["💡 Практические советы"] || [
      "Следите за реакцией клиента",
      "Начинайте с лёгкого давления",
      "Избегайте болезненных ощущений"
    ],
    important_notes: template.important_notes || template["⚠️ Важно"],
    equipment_preparation: template.equipment_preparation || template["🧰 Инвентарь и подготовка"],
    homework: template.homework || template["📚 Домашнее задание"] || "Просмотрите видео урока и попрактикуйтесь 10-15 минут",
    motivational_line: template.motivational_line || template["_мотивационная строка_"] || "Каждая практика приближает вас к мастерству",
  };

  const prompt = createPersonalizationPrompt(template, survey, userName);

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Ты - опытный преподаватель массажа, который персонализирует готовые шаблоны уроков. Отвечай только валидным JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });

    const content = completion.choices[0]?.message?.content || "{}";
    
    // Clean up markdown code blocks if present
    let cleanContent = content.trim();
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    }
    if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    const parsed = JSON.parse(cleanContent);
    
    // Validate and normalize the response
    const validated = validateAndNormalizeResponse(parsed, fallbackTemplate);
    
    return validated;
  } catch (error) {
    console.error("OpenAI API error:", error);
    // Return fallback template on error
    return fallbackTemplate;
  }
}

/**
 * Validates AI response and normalizes to expected structure
 */
function validateAndNormalizeResponse(
  response: any,
  fallback: PersonalizedContent
): PersonalizedContent {
  // Ensure arrays are arrays, not strings
  const ensureArray = (value: any, fallbackValue: string[]): string[] => {
    if (Array.isArray(value)) {
      return value.filter(item => typeof item === 'string' && item.trim().length > 0);
    }
    if (typeof value === 'string' && value.trim()) {
      // Try to split by line breaks if it's a multi-line string
      const lines = value.split(/[\n\r]+/).filter(line => line.trim());
      return lines.length > 1 ? lines : [value];
    }
    return fallbackValue;
  };
  
  return {
    introduction: response.introduction || fallback.introduction,
    key_points: ensureArray(response.key_points, fallback.key_points),
    practical_tips: ensureArray(response.practical_tips, fallback.practical_tips),
    important_notes: response.important_notes ? ensureArray(response.important_notes, []) : undefined,
    equipment_preparation: response.equipment_preparation || fallback.equipment_preparation,
    homework: response.homework || fallback.homework,
    motivational_line: response.motivational_line || fallback.motivational_line,
  };
}
