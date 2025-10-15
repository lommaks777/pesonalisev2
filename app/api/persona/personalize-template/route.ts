import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import OpenAI from "openai";
import fs from "fs";
import path from "path";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface PersonalizeRequest {
  user_id: string;
  lesson_number: number;
  flush?: boolean;
}

/**
 * POST /api/persona/personalize-template
 * Персонализирует готовые шаблоны уроков на основе анкеты пользователя
 */
export async function POST(request: NextRequest) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  try {
    const body: PersonalizeRequest = await request.json();
    const { user_id, lesson_number, flush } = body;

    if (!user_id || !lesson_number) {
      return NextResponse.json(
        { ok: false, error: "user_id and lesson_number are required" },
        { status: 400, headers: corsHeaders }
      );
    }

    const supabase = createSupabaseServerClient();

    // 1. Получаем профиль пользователя
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, name, survey")
      .eq("user_identifier", user_id)
      .maybeSingle();

    if (!profile) {
      return NextResponse.json({
        ok: true,
        html: `
          <div class="persona-block">
            <div class="persona-alert">
              <h3>💡 Персонализация недоступна</h3>
              <p>Заполните анкету, чтобы получить персональные рекомендации для этого урока.</p>
              <a href="/survey/iframe?uid=${user_id}" class="persona-btn" target="_blank">
                Заполнить анкету →
              </a>
            </div>
          </div>
        `,
      }, { headers: corsHeaders });
    }

    // 2. Получаем урок по номеру
    const { data: lesson } = await supabase
      .from("lessons")
      .select("id, title, lesson_number")
      .eq("lesson_number", lesson_number)
      .maybeSingle();

    if (!lesson) {
      return NextResponse.json({
        ok: true,
        html: `
          <div class="persona-block">
            <div class="persona-alert persona-warning">
              <p>Урок ${lesson_number} не найден в базе данных.</p>
            </div>
          </div>
        `,
      }, { headers: corsHeaders });
    }

    // 3. Загружаем шаблон урока
    const templatePath = path.join(process.cwd(), 'store', 'shvz', `${lesson_number}-${lesson_number}-${getLessonId(lesson_number)}-final.json`);
    
    if (!fs.existsSync(templatePath)) {
      return NextResponse.json({
        ok: true,
        html: `
          <div class="persona-block">
            <div class="persona-alert persona-warning">
              <p>Шаблон для урока ${lesson_number} не найден.</p>
            </div>
          </div>
        `,
      }, { headers: corsHeaders });
    }

    const template = JSON.parse(fs.readFileSync(templatePath, 'utf8'));

    // 4. Персонализируем шаблон
    const personalizedContent = await personalizeTemplate(template, profile.survey, profile.name);

    // 5. Сохраняем персонализацию
    const { error: saveError } = await supabase
      .from("personalized_lesson_descriptions")
      .upsert({
        profile_id: profile.id,
        lesson_id: lesson.id,
        content: personalizedContent,
      });

    if (saveError) {
      console.error("Error saving personalization:", saveError);
    }

    // 6. Формируем HTML
    const html = formatPersonalizedContent(personalizedContent);

    return NextResponse.json({
      ok: true,
      html: html,
      cached: !flush,
    }, { headers: corsHeaders });

  } catch (error) {
    console.error("Error in POST /api/persona/personalize-template:", error);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500, headers: corsHeaders }
    );
  }
}

/**
 * Получает ID урока для загрузки шаблона
 */
function getLessonId(lessonNumber: number): string {
  const lessonIds: Record<number, string> = {
    1: "1-f9b62dc5-9b76-491d-8b9b-2b72411df740",
    2: "c8a90762-6fca-47a8-80c3-5f454ae05273",
    3: "1c75e3db-9afd-4237-8b8f-16be2b00ae0c",
    4: "61b19549-d1bf-4265-bb1e-ff21ae7891a0",
    5: "5-387be494-dcf4-41a0-83c2-380fdd4f4cc1",
    6: "6-913d5be1-bbfb-4d32-b4d2-157d10551389",
    7: "7-e0f961c1-b8e3-4f57-939d-fb188d2703a9",
    8: "722e1278-2dcf-4e76-baa3-8d674f3abda4",
    9: "56766339-03e0-4c1b-9d99-cc49590ad3fd",
    10: "10-69b9560e-2af2-4690-af44-1398ace0f75e",
    11: "11-8227a790-17ef-489a-8538-afbe2c4c10ce",
    12: "12-26ef3e23-3d2e-4461-80bf-622f26737528",
  };
  
  return lessonIds[lessonNumber] || "";
}

/**
 * Персонализирует шаблон на основе анкеты пользователя
 */
async function personalizeTemplate(template: any, survey: any, userName: string): Promise<Record<string, unknown>> {
  const prompt = `Ты - опытный преподаватель массажа Анастасия Фомина. Персонализируй готовый шаблон урока на основе анкеты студента.

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
    return JSON.parse(content);
  } catch (error) {
    console.error("OpenAI API error:", error);
    // Возвращаем оригинальный шаблон при ошибке
    return template;
  }
}

/**
 * Форматирует персонализированный контент в HTML
 */
function formatPersonalizedContent(content: any): string {
  return `
    <div class="persona-block">
      ${content.summary_short ? `
        <div class="persona-section">
          <h3 class="persona-section-title">📝 О уроке</h3>
          <p class="persona-text">${content.summary_short}</p>
        </div>
      ` : ''}

      ${content.prev_lessons ? `
        <div class="persona-section">
          <h3 class="persona-section-title">📚 Что мы изучили</h3>
          <p class="persona-text">${content.prev_lessons}</p>
        </div>
      ` : ''}

      ${content.why_watch ? `
        <div class="persona-section">
          <h3 class="persona-section-title">🎯 Зачем смотреть</h3>
          <p class="persona-text">${content.why_watch}</p>
        </div>
      ` : ''}

      ${content.quick_action ? `
        <div class="persona-section">
          <h3 class="persona-section-title">⚡ Быстрое действие</h3>
          <p class="persona-text">${content.quick_action}</p>
        </div>
      ` : ''}

      ${content.homework_20m ? `
        <div class="persona-section persona-homework">
          <h3 class="persona-section-title">📚 Домашнее задание (20 мин)</h3>
          <p class="persona-text">${content.homework_20m}</p>
        </div>
      ` : ''}

      ${content.social_share ? `
        <div class="persona-section persona-social">
          <h3 class="persona-section-title">📱 Поделиться</h3>
          <p class="persona-text">${content.social_share}</p>
        </div>
      ` : ''}
    </div>
  `;
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
