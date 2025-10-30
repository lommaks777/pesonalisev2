/**
 * Personalization Engine - Direct Generation from Transcripts
 * 
 * This service generates rich, personalized lesson descriptions by analyzing
 * full lesson transcripts against detailed student profiles in a single AI call.
 * 
 * Key Improvements over Template-Based Approach:
 * - Processes full 8-18k character transcripts instead of compressed summaries
 * - Single GPT-4o call with complete context (transcript + survey data)
 * - Deep semantic matching between lesson content and student goals
 * - Eliminates information loss from intermediate template generation
 */

import { getOpenAIClient } from "./openai";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * New personalized content structure (7 sections)
 * Designed for rich, context-aware descriptions
 */
export interface PersonalizedContent {
  introduction: string;                    // 2-3 sentences: name + lesson goal + wow_result
  why_it_matters_for_you: string;          // 4-5 sentences: fears + goals + target_clients
  key_takeaways: string[];                 // 3-4 specific outcomes from transcript
  practical_application: string;           // 3-4 sentences: practice_model + target_clients
  addressing_fears: string;                // 2-3 sentences: direct reference to fears
  personalized_homework: string;           // 2-4 sentences: tailored to practice_model
  motivational_quote: string;              // 1 sentence: reference wow_result
}

/**
 * Student survey data structure
 */
export interface SurveyData {
  motivation?: string[];
  target_clients?: string;
  skills_wanted?: string;
  fears?: string[];
  wow_result?: string;
  practice_model?: string;
}

/**
 * Lesson metadata from database
 */
export interface LessonMetadata {
  lesson_number: number;
  title: string;
}

/**
 * Lesson transcript loaded from database
 */
export interface LessonTranscript {
  transcription: string;
  transcription_length?: number;
  transcription_source?: string;
  transcription_date?: string;
}

/**
 * Load lesson transcript from database by lesson ID
 * Checks both direct transcription field and content.transcription JSON field
 * Migration 004 moved transcriptions to direct field, but some may still be in content
 */
export async function loadLessonTranscript(
  lessonId: string
): Promise<LessonTranscript | null> {
  try {
    const supabase = createSupabaseServerClient();

    // Use 'any' for now until types are fully updated
    const { data, error } = await supabase
      .from("lessons")
      .select("transcription, content")
      .eq("id", lessonId as any)
      .maybeSingle() as any;

    if (error) {
      console.error(`Failed to load transcript for lesson ${lessonId}:`, error);
      return null;
    }

    if (!data) {
      console.error(`No data found for lesson ${lessonId}`);
      return null;
    }

    // Check direct transcription field first (migration 004)
    let transcript = data.transcription as string | null;
    let source = 'database_direct_field';

    // If not in direct field, check content.transcription (legacy)
    if (!transcript || typeof transcript !== 'string' || transcript.trim().length === 0) {
      const content = data.content as any;
      if (content && content.transcription && typeof content.transcription === 'string') {
        transcript = content.transcription;
        source = 'database_content_json';
        console.log(`⚠️  Lesson ${lessonId} has transcription in content JSON field (legacy), consider migrating to direct field`);
      }
    }

    // Final validation
    if (!transcript || typeof transcript !== 'string') {
      console.error(`No transcript found for lesson ${lessonId}`);
      return null;
    }

    // Check if transcription is empty
    if (transcript.trim().length === 0) {
      console.error(`Empty transcript for lesson ${lessonId}`);
      return null;
    }

    console.log(`✅ Loaded transcript for lesson ${lessonId} from ${source} (${transcript.length} chars)`);

    return {
      transcription: transcript,
      transcription_length: transcript.length,
      transcription_source: source,
    };
  } catch (error) {
    console.error("Error loading lesson transcript:", error);
    return null;
  }
}

/**
 * Create personalization prompt with full transcript and survey context
 * 
 * This prompt instructs GPT-4o to:
 * 1. Analyze full lesson transcript for concrete examples and techniques
 * 2. Map transcript content to specific student profile attributes
 * 3. Generate deeply personalized descriptions with specific references
 * 4. Create actionable homework tailored to student's practice environment
 */
function createPersonalizationPrompt(
  transcript: string,
  lessonMetadata: LessonMetadata,
  survey: SurveyData,
  userName: string
): string {
  return `Ты - опытный методолог курса массажа и копирайтер. Твоя задача - создать ГЛУБОКО ПЕРСОНАЛИЗИРОВАННОЕ описание урока на основе полной расшифровки видео и детальной анкеты студента.

ИНФОРМАЦИЯ ОБ УРОКЕ:
Номер урока: ${lessonMetadata.lesson_number}
Название: ${lessonMetadata.title}

ПОЛНАЯ РАСШИФРОВКА УРОКА (${transcript.length} символов):
${transcript}

АНКЕТА СТУДЕНТА:
- Имя: ${userName}
- Мотивация: ${survey.motivation?.join(", ") || "не указано"}
- Целевые клиенты: ${survey.target_clients || "не указано"}
- Желаемые навыки: ${survey.skills_wanted || "не указано"}
- Страхи/опасения: ${survey.fears?.join(", ") || "не указано"}
- Желаемый wow-результат: ${survey.wow_result || "не указано"}
- Модель практики: ${survey.practice_model || "не указано"}

ЗАДАНИЕ:
Создай персонализированное описание урока, которое демонстрирует КОНКРЕТНУЮ ЦЕННОСТЬ для ЭТОГО студента.

СТРУКТУРА ОПИСАНИЯ (7 разделов):

1. **introduction** (Введение):
   - Обратись к студенту по имени
   - Укажи цель урока (из расшифровки)
   - Свяжи с их ожидаемым wow-результатом
   - НЕ упоминай номер урока ("урок 17", "в этом уроке" и т.п.)
   - 2-3 предложения

2. **why_it_matters_for_you** (Почему это важно именно для вас):
   - Проанализируй расшифровку: какие конкретные техники/знания там даны
   - Покажи, как ЭТИ конкретные техники помогут с их страхами
   - Свяжи с их целевыми клиентами
   - Объясни, как это продвинет их к wow-результату
   - 4-5 предложений с КОНКРЕТНЫМИ примерами из расшифровки

3. **key_takeaways** (Ключевые выводы):
   - Массив из 3-4 пунктов
   - Каждый пункт - КОНКРЕТНЫЙ навык/знание из расшифровки
   - Формулировка: "Вы узнаете/научитесь/поймёте..."
   - Адаптируй примеры под целевых клиентов студента
   - Каждый пункт ≤ 20 слов

4. **practical_application** (Практическое применение):
   - Как КОНКРЕТНЫЕ техники из урока применить в их модели практики
   - Примеры ситуаций с их целевыми клиентами
   - Конкретные действия, которые они смогут делать после урока
   - 3-4 предложения

5. **addressing_fears** (Ответ на опасения):
   - Прямо обратись к их страхам из анкеты
   - Объясни, какие КОНКРЕТНЫЕ моменты из урока помогут преодолеть эти страхи
   - Укажи на конкретные техники безопасности/правильного выполнения из расшифровки
   - 2-3 предложения

6. **personalized_homework** (Персональное домашнее задание):
   - Конкретное задание, адаптированное под их модель практики
   - Учитывай их уровень опыта и целевых клиентов
   - Реалистичное и выполнимое
   - 2-4 предложения

7. **motivational_quote** (Мотивационная фраза):
   - Свяжи с их wow-результатом
   - Вдохновляющий, но реалистичный тон
   - 1 предложение

КРИТЕРИИ КАЧЕСТВА:
✓ Каждый раздел должен содержать КОНКРЕТНЫЕ ссылки на содержание урока
✓ Избегай общих фраз типа "вы научитесь массажу" - будь КОНКРЕТЕН
✓ Используй терминологию и примеры из расшифровки
✓ Каждое утверждение должно демонстрировать знание как урока, так и профиля студента
✓ Язык: дружелюбный, профессиональный, обращение на "вы"
✓ Уровень языка: B1-B2 (понятно без специальной подготовки)
✓ ВСЕ ТЕКСТЫ ТОЛЬКО НА РУССКОМ ЯЗЫКЕ (RUSSIAN LANGUAGE ONLY)

ФОРМАТ ОТВЕТА (строго JSON):
{
  "introduction": "строка",
  "why_it_matters_for_you": "строка",
  "key_takeaways": ["пункт 1", "пункт 2", "пункт 3"],
  "practical_application": "строка",
  "addressing_fears": "строка",
  "personalized_homework": "строка",
  "motivational_quote": "строка"
}

Отвечай ТОЛЬКО валидным JSON на РУССКОМ языке без markdown-разметки и дополнительного текста.`;
}

/**
 * Validate and normalize AI response structure
 */
function validateAndNormalizeResponse(
  response: any,
  fallback: PersonalizedContent
): PersonalizedContent {
  // Ensure arrays are actually arrays
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
    why_it_matters_for_you: response.why_it_matters_for_you || fallback.why_it_matters_for_you,
    key_takeaways: ensureArray(response.key_takeaways, fallback.key_takeaways),
    practical_application: response.practical_application || fallback.practical_application,
    addressing_fears: response.addressing_fears || fallback.addressing_fears,
    personalized_homework: response.personalized_homework || fallback.personalized_homework,
    motivational_quote: response.motivational_quote || fallback.motivational_quote,
  };
}

/**
 * Generate fallback content when AI generation fails
 * Uses basic personalization with available data
 */
function createFallbackContent(
  lessonMetadata: LessonMetadata,
  userName: string,
  survey: SurveyData
): PersonalizedContent {
  return {
    introduction: `${userName}, в этом уроке "${lessonMetadata.title}" вы освоите важные техники массажа, которые приблизят вас к вашей цели.`,
    why_it_matters_for_you: `Этот урок даст вам практические навыки работы с клиентами. Вы узнаете, как правильно выполнять техники, избежать типичных ошибок и повысить эффективность своей работы. Полученные знания помогут вам уверенно работать с ${survey.target_clients || "разными клиентами"}.`,
    key_takeaways: [
      "Вы освоите основные техники работы, показанные в уроке",
      "Вы поймёте принципы безопасного и эффективного выполнения",
      "Вы научитесь адаптировать техники под разных клиентов"
    ],
    practical_application: `После урока вы сможете применять изученные техники в своей практике. ${survey.practice_model ? `Особенно полезно для ${survey.practice_model}.` : ""} Начните с отработки базовых движений, затем переходите к работе с реальными клиентами.`,
    addressing_fears: survey.fears && survey.fears.length > 0
      ? `В уроке уделено внимание безопасности и правильной технике, что поможет избежать ${survey.fears[0]}. Вы получите чёткие инструкции и рекомендации.`
      : "В уроке подробно разобраны все важные моменты техники и меры предосторожности.",
    personalized_homework: "Просмотрите урок внимательно, делая заметки по ключевым моментам. Затем попрактикуйте основные движения 10-15 минут.",
    motivational_quote: survey.wow_result
      ? `Каждый урок приближает вас к цели: ${survey.wow_result}`
      : "Регулярная практика - ваш путь к мастерству!"
  };
}

/**
 * Main function: Generate personalized description from transcript
 * 
 * @param lessonId - UUID of lesson in database
 * @param transcript - Full lesson transcript
 * @param lessonMetadata - Lesson number and title
 * @param surveyData - Student profile from survey
 * @param userName - Student's name
 * @returns Personalized content or throws error
 */
export async function generatePersonalizedDescription(
  lessonId: string,
  transcript: string,
  lessonMetadata: LessonMetadata,
  surveyData: SurveyData,
  userName: string
): Promise<PersonalizedContent> {
  const openai = getOpenAIClient();

  // Prepare fallback content
  const fallbackContent = createFallbackContent(lessonMetadata, userName, surveyData);

  // Validate transcript
  if (!transcript || transcript.trim().length < 1000) {
    console.warn(`Transcript too short for lesson ${lessonId}, using fallback`);
    return fallbackContent;
  }

  // Construct prompt
  const prompt = createPersonalizationPrompt(transcript, lessonMetadata, surveyData, userName);

  try {
    // Call GPT-4o with full context
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Ты - опытный методолог курса массажа и копирайтер. Создаёшь глубоко персонализированные описания уроков. Отвечаешь только валидным JSON на РУССКОМ языке. You must respond in Russian language only.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2500,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content || "{}";

    // Clean up potential markdown code blocks
    let cleanContent = content.trim();
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    }
    if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    // Parse and validate
    const parsed = JSON.parse(cleanContent);
    const validated = validateAndNormalizeResponse(parsed, fallbackContent);

    console.log(`✅ Generated personalized description for lesson ${lessonId}`);
    return validated;

  } catch (error) {
    console.error(`Error generating personalization for lesson ${lessonId}:`, error);

    // Retry once with lower temperature
    try {
      console.log(`Retrying with adjusted temperature for lesson ${lessonId}...`);
      
      const retryCompletion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "Ты - опытный методолог курса массажа и копирайтер. Создаёшь глубоко персонализированные описания уроков. Отвечаешь только валидным JSON на РУССКОМ языке. You must respond in Russian language only.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.5,
        max_tokens: 2500,
        response_format: { type: "json_object" },
      });

      const retryContent = retryCompletion.choices[0]?.message?.content || "{}";
      let cleanRetryContent = retryContent.trim();
      if (cleanRetryContent.startsWith('```json')) {
        cleanRetryContent = cleanRetryContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      }
      if (cleanRetryContent.startsWith('```')) {
        cleanRetryContent = cleanRetryContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      const retryParsed = JSON.parse(cleanRetryContent);
      const retryValidated = validateAndNormalizeResponse(retryParsed, fallbackContent);

      console.log(`✅ Retry successful for lesson ${lessonId}`);
      return retryValidated;

    } catch (retryError) {
      console.error(`Retry failed for lesson ${lessonId}, using fallback:`, retryError);
      // Return fallback content
      return fallbackContent;
    }
  }
}
