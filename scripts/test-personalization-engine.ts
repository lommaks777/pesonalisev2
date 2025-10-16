/**
 * Test Script: Verify New Personalization Engine
 * 
 * Tests the new direct-from-transcript personalization generation
 * for a single lesson to validate the complete workflow.
 */

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { getOpenAIClient } from "../lib/services/openai";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

interface SurveyData {
  motivation?: string[];
  target_clients?: string;
  skills_wanted?: string;
  fears?: string[];
  wow_result?: string;
  practice_model?: string;
}

interface LessonMetadata {
  lesson_number: number;
  title: string;
}

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
${transcript.substring(0, 15000)}${transcript.length > 15000 ? "..." : ""}

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

Отвечай ТОЛЬКО валидным JSON без markdown-разметки и дополнительного текста.`;
}

async function testPersonalizationEngine() {
  console.log("=== Testing New Personalization Engine ===\n");

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error("Missing Supabase credentials");
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // Test with lesson 1
  const testLessonNumber = 1;

  try {
    // 1. Get lesson from database
    console.log(`📚 Loading lesson ${testLessonNumber}...`);
    const { data: lesson, error: lessonError } = await supabase
      .from("lessons")
      .select("id, lesson_number, title, content")
      .eq("lesson_number", testLessonNumber)
      .single();

    if (lessonError || !lesson) {
      throw new Error(`Failed to load lesson: ${lessonError?.message || "Not found"}`);
    }

    console.log(`✅ Loaded: ${lesson.title}`);
    console.log(`   Lesson ID: ${lesson.id}\n`);

    // 2. Load transcript
    console.log("📄 Loading transcript from database...");
    const transcriptContent = lesson.content as any;

    if (!transcriptContent || !transcriptContent.transcription) {
      throw new Error("Failed to load transcript");
    }

    const transcript = transcriptContent.transcription;

    console.log(`✅ Transcript loaded: ${transcriptContent.transcription_length || transcript.length} characters\n`);

    // 3. Prepare test survey data
    const testSurvey: SurveyData = {
      motivation: ["Начать свою практику", "Помогать близким"],
      target_clients: "Друзья и семья",
      skills_wanted: "Релаксационный массаж",
      fears: ["Сделать больно клиенту", "Неправильная техника"],
      wow_result: "Уверенно делать массаж близким и получать благодарность",
      practice_model: "Дом"
    };

    const testUserName = "Мария";

    console.log("👤 Test User Profile:");
    console.log(`   Name: ${testUserName}`);
    console.log(`   Target clients: ${testSurvey.target_clients}`);
    console.log(`   Fears: ${testSurvey.fears?.join(", ")}`);
    console.log(`   Wow result: ${testSurvey.wow_result}\n`);

    // 4. Generate personalization
    console.log("🤖 Generating personalized description with GPT-4o...");
    console.log("   (This may take 10-15 seconds)\n");

    const startTime = Date.now();

    const lessonMetadata: LessonMetadata = {
      lesson_number: lesson.lesson_number,
      title: lesson.title
    };

    const prompt = createPersonalizationPrompt(transcript, lessonMetadata, testSurvey, testUserName);
    
    const openai = getOpenAIClient();
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Ты - опытный методолог курса массажа и копирайтер. Создаёшь глубоко персонализированные описания уроков. Отвечаешь только валидным JSON.",
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
    let cleanContent = content.trim();
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    }
    if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const personalization = JSON.parse(cleanContent);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`✅ Personalization generated in ${duration}s\n`);

    // 5. Display results
    console.log("=== Generated Personalized Content ===\n");
    console.log(`📝 Introduction:\n${personalization.introduction}\n`);
    console.log(`💡 Why It Matters For You:\n${personalization.why_it_matters_for_you}\n`);
    console.log(`🎯 Key Takeaways:`);
    personalization.key_takeaways.forEach((item, i) => {
      console.log(`   ${i + 1}. ${item}`);
    });
    console.log();
    console.log(`🛠️ Practical Application:\n${personalization.practical_application}\n`);
    console.log(`🛡️ Addressing Fears:\n${personalization.addressing_fears}\n`);
    console.log(`📚 Personalized Homework:\n${personalization.personalized_homework}\n`);
    console.log(`✨ Motivational Quote:\n"${personalization.motivational_quote}"\n`);

    // 6. Quality checks
    console.log("=== Quality Validation ===");
    
    const checks = {
      "Has student name": personalization.introduction.includes(testUserName),
      "References fears": 
        personalization.addressing_fears.toLowerCase().includes("страх") ||
        personalization.addressing_fears.toLowerCase().includes("опасен") ||
        personalization.why_it_matters_for_you.toLowerCase().includes("больно"),
      "References target clients": 
        personalization.practical_application.toLowerCase().includes("друз") ||
        personalization.practical_application.toLowerCase().includes("сем") ||
        personalization.practical_application.toLowerCase().includes("близ"),
      "References wow result": 
        personalization.motivational_quote.toLowerCase().includes("уверен") ||
        personalization.introduction.toLowerCase().includes("уверен"),
      "Has 3+ key takeaways": personalization.key_takeaways.length >= 3,
      "All fields non-empty": 
        personalization.introduction.length > 0 &&
        personalization.why_it_matters_for_you.length > 0 &&
        personalization.practical_application.length > 0 &&
        personalization.addressing_fears.length > 0 &&
        personalization.personalized_homework.length > 0 &&
        personalization.motivational_quote.length > 0
    };

    let passedChecks = 0;
    Object.entries(checks).forEach(([check, passed]) => {
      console.log(`${passed ? "✅" : "❌"} ${check}`);
      if (passed) passedChecks++;
    });

    const score = (passedChecks / Object.keys(checks).length * 100).toFixed(0);
    console.log(`\n📊 Quality Score: ${score}% (${passedChecks}/${Object.keys(checks).length} checks passed)\n`);

    if (passedChecks === Object.keys(checks).length) {
      console.log("🎉 All quality checks passed!");
    } else {
      console.log("⚠️  Some quality checks failed. Review the output above.");
    }

  } catch (error) {
    console.error("\n❌ Test failed:", error);
    process.exit(1);
  }
}

// Run test
testPersonalizationEngine()
  .then(() => {
    console.log("\n✅ Test completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Test failed:", error);
    process.exit(1);
  });
