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

// Types
export interface PersonalizedContent {
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
 * Personalization prompt template
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
Персонализируй каждый элемент шаблона, учитывая:
1. Обращайся к студенту по имени
2. Учитывай его мотивацию и цели
3. Адресуй его страхи и опасения
4. Адаптируй домашнее задание под его модель для практики
5. Связывай с его ожидаемым результатом

ФОРМАТ ОТВЕТА (JSON):
{
  "summary_short": "Персонализированное краткое описание",
  "why_watch": "Зачем смотреть этот урок с учетом мотивации студента",
  "quick_action": "Быстрое действие с учетом модели для практики",
  "social_share": "Сообщение для социальных сетей",
  "homework_20m": "Персонализированное домашнее задание на 20 минут"
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

  // Fallback template structure
  const fallbackTemplate: PersonalizedContent = {
    summary_short: template.summary_short || `Урок ${lessonInfo.lesson_number}: ${lessonInfo.title}`,
    why_watch: template.why_watch || "Этот урок поможет вам освоить важные техники массажа",
    quick_action: template.quick_action || "Просмотрите видео урока внимательно",
    social_share: template.social_share || "Изучаю новые техники массажа!",
    homework_20m: template.homework_20m || "Просмотрите видео урока и попрактикуйтесь 10-15 минут",
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
      max_tokens: 1000,
    });

    const content = completion.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(content);
    
    // Return parsed content, merging with fallback for any missing fields
    return {
      ...fallbackTemplate,
      ...parsed,
    };
  } catch (error) {
    console.error("OpenAI API error:", error);
    // Return original template on error
    return fallbackTemplate;
  }
}
