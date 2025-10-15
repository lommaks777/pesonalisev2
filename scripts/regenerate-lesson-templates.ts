import "dotenv/config";
import OpenAI from "openai";
import fs from 'fs';
import path from 'path';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface LessonInfo {
  number: number;
  title: string;
  description: string;
}

/**
 * Получает информацию об уроке из JSON файла
 */
function getLessonInfo(lessonNumber: number): LessonInfo | null {
  const lessonPath = path.join(process.cwd(), 'store', 'shvz', 'lessons', lessonNumber.toString().padStart(2, '0'), 'lesson.json');
  
  if (!fs.existsSync(lessonPath)) {
    console.log(`❌ Файл урока ${lessonNumber} не найден: ${lessonPath}`);
    return null;
  }

  try {
    const lessonData = JSON.parse(fs.readFileSync(lessonPath, 'utf8'));
    return {
      number: lessonData.number,
      title: lessonData.title,
      description: lessonData.description
    };
  } catch (error) {
    console.error(`❌ Ошибка чтения урока ${lessonNumber}:`, error);
    return null;
  }
}

/**
 * Читает транскрипт урока
 */
function getTranscript(lessonNumber: number): string | null {
  // Ищем файл транскрипта по паттерну
  const transcriptDir = path.join(process.cwd(), 'store', 'shvz');
  const files = fs.readdirSync(transcriptDir);
  
  // Ищем файл с номером урока
  const transcriptFile = files.find(file => 
    file.startsWith(`${lessonNumber}-`) && file.endsWith('.txt')
  );
  
  if (!transcriptFile) {
    console.log(`❌ Транскрипт для урока ${lessonNumber} не найден`);
    return null;
  }

  try {
    const transcriptPath = path.join(transcriptDir, transcriptFile);
    return fs.readFileSync(transcriptPath, 'utf8');
  } catch (error) {
    console.error(`❌ Ошибка чтения транскрипта урока ${lessonNumber}:`, error);
    return null;
  }
}

/**
 * Генерирует новую "рыбу" урока на основе транскрипта
 */
async function generateLessonTemplate(lessonInfo: LessonInfo, transcript: string): Promise<Record<string, string> | null> {
  const prompt = `Ты методист и редактор транскриптов. 
Задача: из «сырой» транскрибации урока по массажу сделать компактную карточку-резюме для студентов. 
Работай строго по фактам транскрипта, ничего не выдумывай.

ИНФОРМАЦИЯ ОБ УРОКЕ:
- Номер: ${lessonInfo.number}
- Название: ${lessonInfo.title}
- Описание: ${lessonInfo.description}

ТРАНСКРИПТ УРОКА:
${transcript}

ТРЕБОВАНИЯ К ВЫХОДУ (чистый Markdown, без преамбул, без пояснений):
1) 👋 **Введение**  
   2–3 коротких предложения. 
   Укажи цель урока простыми словами и ожидаемый результат.

2) 🔑 **Ключевые моменты**  
   4–6 пунктов, каждый ≤ 18 слов. Форматируй как «что узнаете/научитесь/поймёте». 
   Сфокусируйся на техниках, зонах работы, критериях эффективности, адаптациях под клиента/аудиторию.

3) 💡 **Практические советы**  
   3–5 пунктов-инструкций, каждый начинается с глагола («Делайте…», «Избегайте…», «Следите…»). 
   Включи безопасность, коммуникацию с клиентом, контроль боли/давления, типичные ошибки и как их избежать.

4) ⚠️ **Важно** *(раздел добавляй только если это явно есть в транскрипте)*  
   2–4 пункта про противопоказания, ограничения, меру давления/времени, что «не делать».

5) 🧰 **Инвентарь и подготовка** *(добавляй, если встречается)*  
   Краткий список: стол/стул, масло/крем, полотенце, тайминг, положение модели.

6) 📚 **Домашнее задание**  
   1–2 предложения с конкретным, проверяемым действием (что сделать, сколько раз/времени, что записать/замерить).

7) _(мотивационная строка)_  
   1 предложение курсивом, вдохновляющее двигаться к результату, без маркетингового пафоса.

СТИЛЬ И ОГРАНИЧЕНИЯ:
- Ясно и дружелюбно (уровень чтения B1–B2), без медицинских диагнозов и обещаний лечения. 
- Термины поясняй по-простому (напр., «грудинно-ключично-сосцевидная мышца — мышца сбоку шеи»).
- Убирай повторы, паразитные слова, оговорки, «повторяйте за мной», рассинхроны.
- Числа и дозировки времени указывай только если есть в транскрипте; иначе пропусти. 
- Не добавляй ссылки, источники и «лишние» эмодзи; используй эмодзи только в заголовках, как в шаблоне.
- Если данных для какого-то раздела нет — просто опусти его.

ЖЁСТКИЕ ЗАПРЕТЫ:
- Не используй общие фразы уровня «вы узнаете/поймёте/эта техника важна» без факта из транскрипта.
- Не добавляй техники, зоны, эффекты, противопоказания, которых нет в транскрипте.
- Пиши только факты и формулировки, которые прямо следуют из транскрипта (или нейтральные связки).

ТОЧНОСТЬ:
- Используй только те мышцы/зоны/приёмы, что названы в транскрипте; остальное опускай.
- Если критерии эффективности/тайминги не названы — не выдумывай.

ПРИМЕЧАНИЕ ПО ПЕРЕФОРМАТИРОВАНИЮ ТЕКСТА:
- Аггрегируй рассыпанные по уроку шаги в логичный порядок: подготовка → ключевые приёмы → контроль ощущений/безопасность → завершение.
- Критерии эффективности (покраснение/потепление тканей, снижение боли ~50%, т.д.) выноси в «Ключевые моменты» или «Практические советы» — если они есть в транскрипте.
- Тайминг и оборудование выноси в «Инвентарь и подготовка» — если явно упомянуты.

ФОРМАТ ОТВЕТА (JSON):
{
  "summary_short": "Краткое описание урока (2-3 предложения)",
  "why_watch": "Зачем смотреть этот урок - польза и важность (3-4 предложения)",
  "quick_action": "Быстрое действие - что можно сделать прямо сейчас (1-2 предложения)",
  "social_share": "Сообщение для социальных сетей (1 предложение)",
  "homework_20m": "Домашнее задание на 20 минут - пошаговая инструкция (5-7 пунктов)"
}

ВАЖНО:
- Не включай поле "prev_lessons" - оно больше не используется
- Сделай описание универсальным, но детальным
- Укажи конкретные техники и упражнения
- Включи практические советы для массажистов

Отвечай ТОЛЬКО валидным JSON, без дополнительного текста.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Ты - методист и редактор транскриптов курса массажа. Создаешь структурированные описания уроков на основе транскриптов. Работаешь строго по фактам, ничего не выдумываешь."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      console.error(`❌ Пустой ответ от OpenAI для урока ${lessonInfo.number}`);
      return null;
    }

    // Очищаем ответ от markdown блоков
    let cleanResponse = response.trim();
    if (cleanResponse.startsWith('```json')) {
      cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    }
    if (cleanResponse.startsWith('```')) {
      cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    // Парсим JSON ответ
    try {
      const template = JSON.parse(cleanResponse);
      return template;
    } catch (parseError) {
      console.error(`❌ Ошибка парсинга JSON для урока ${lessonInfo.number}:`, parseError);
      console.log('Очищенный ответ от OpenAI:', cleanResponse);
      return null;
    }

  } catch (error) {
    console.error(`❌ Ошибка OpenAI для урока ${lessonInfo.number}:`, error);
    return null;
  }
}

/**
 * Сохраняет новую "рыбу" урока
 */
function saveLessonTemplate(lessonNumber: number, template: Record<string, string>): boolean {
  try {
    const transcriptDir = path.join(process.cwd(), 'store', 'shvz');
    const id = getLessonId(lessonNumber);
    // Единый формат имени файла: {number}-{id}-final.json
    const fileName = `${lessonNumber}-${id}-final.json`;
    const outputPath = path.join(transcriptDir, fileName);
    
    // Создаем резервную копию
    const backupPath = outputPath.replace('.json', '-backup.json');
    if (fs.existsSync(outputPath)) {
      fs.copyFileSync(outputPath, backupPath);
      console.log(`📁 Создана резервная копия: ${backupPath}`);
    }

    // Сохраняем новый файл
    fs.writeFileSync(outputPath, JSON.stringify(template, null, 4), 'utf8');
    console.log(`✅ Сохранен новый шаблон: ${outputPath}`);
    
    return true;
  } catch (error) {
    console.error(`❌ Ошибка сохранения для урока ${lessonNumber}:`, error);
    return false;
  }
}

/**
 * Основная функция
 */
async function regenerateLessonTemplates() {
  console.log('🔄 Начинаем пересоздание "рыб" уроков...\n');

  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY не задан');
    process.exit(1);
  }

  const lessonsToProcess = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  let successCount = 0;
  let errorCount = 0;

  for (const lessonNumber of lessonsToProcess) {
    console.log(`\n📚 Обрабатываем урок ${lessonNumber}...`);
    
    // 1. Получаем информацию об уроке
    const lessonInfo = getLessonInfo(lessonNumber);
    if (!lessonInfo) {
      console.log(`❌ Пропускаем урок ${lessonNumber} - нет информации`);
      errorCount++;
      continue;
    }

    // 2. Читаем транскрипт
    const transcript = getTranscript(lessonNumber);
    if (!transcript) {
      console.log(`❌ Пропускаем урок ${lessonNumber} - нет транскрипта`);
      errorCount++;
      continue;
    }

    console.log(`📝 Транскрипт загружен (${transcript.length} символов)`);

    // 3. Генерируем новую "рыбу"
    console.log(`🤖 Генерируем новую "рыбу" для урока ${lessonNumber}...`);
    const template = await generateLessonTemplate(lessonInfo, transcript);
    
    if (!template) {
      console.log(`❌ Не удалось сгенерировать шаблон для урока ${lessonNumber}`);
      errorCount++;
      continue;
    }

    // 4. Сохраняем результат
    const saved = saveLessonTemplate(lessonNumber, template);
    if (saved) {
      console.log(`✅ Урок ${lessonNumber} успешно обновлен`);
      successCount++;
    } else {
      console.log(`❌ Не удалось сохранить урок ${lessonNumber}`);
      errorCount++;
    }

    // Небольшая пауза между запросами
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log(`\n🎉 Пересоздание завершено!`);
  console.log(`✅ Успешно: ${successCount}`);
  console.log(`❌ Ошибок: ${errorCount}`);
  console.log(`📊 Всего обработано: ${successCount + errorCount}`);
}

// Запускаем скрипт
regenerateLessonTemplates().catch(console.error);
