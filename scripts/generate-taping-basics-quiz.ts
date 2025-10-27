import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import OpenAI from 'openai';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const openaiKey = process.env.OPENAI_API_KEY!;

if (!supabaseUrl || !supabaseKey || !openaiKey) {
  console.error('Missing required credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const openai = new OpenAI({ apiKey: openaiKey });

interface QuizQuestion {
  question: string;
  answers: {
    text: string;
    isCorrect: boolean;
  }[];
}

interface LessonQuiz {
  lessonNumber: number;
  lessonTitle: string;
  questions: QuizQuestion[];
}

async function generateQuizForLesson(
  lessonNumber: number,
  lessonTitle: string,
  transcription: string
): Promise<QuizQuestion[]> {
  console.log(`  Generating quiz for lesson ${lessonNumber}...`);

  const prompt = `На основе транскрипции урока создай 3 вопроса для проверки внимательности просмотра.

УРОК: ${lessonTitle}

ТРАНСКРИПЦИЯ:
${transcription}

ТРЕБОВАНИЯ:
1. Создай ровно 3 вопроса
2. Каждый вопрос должен проверять конкретные факты из урока
3. К каждому вопросу 3 варианта ответа (только 1 правильный)
4. Вопросы должны быть о конкретных техниках, деталях, рекомендациях из урока
5. Неправильные ответы должны быть правдоподобными, но явно отличаться от правильного

ФОРМАТ ОТВЕТА (строго JSON):
{
  "questions": [
    {
      "question": "Текст вопроса?",
      "answers": [
        {"text": "Вариант ответа 1", "isCorrect": false},
        {"text": "Вариант ответа 2 (правильный)", "isCorrect": true},
        {"text": "Вариант ответа 3", "isCorrect": false}
      ]
    }
  ]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'Ты эксперт по созданию обучающих тестов. Отвечай только валидным JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No content in response');
    }

    const parsed = JSON.parse(content);
    return parsed.questions as QuizQuestion[];
  } catch (error) {
    console.error(`  ❌ Error generating quiz:`, error);
    return [];
  }
}

async function generateTapingBasicsQuiz() {
  console.log('🎯 Generating quiz for taping-basics course...\n');

  // Get the taping-basics course
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('*')
    .eq('slug', 'taping-basics')
    .single();

  if (courseError || !course) {
    console.error('Error fetching taping-basics course:', courseError);
    return;
  }

  console.log(`📚 Course: ${course.title}\n`);

  // Get all lessons for this course
  const { data: lessons, error: lessonsError } = await supabase
    .from('lessons')
    .select('*')
    .eq('course_id', course.id)
    .order('lesson_number');

  if (lessonsError || !lessons || lessons.length === 0) {
    console.error('Error fetching lessons:', lessonsError);
    return;
  }

  console.log(`Found ${lessons.length} lessons\n`);

  const allQuizzes: LessonQuiz[] = [];

  for (const lesson of lessons) {
    const lessonTyped = lesson as any;
    const transcription = lessonTyped.content?.transcription;

    if (!transcription) {
      console.log(`⚠️  Lesson ${lessonTyped.lesson_number}: No transcription found, skipping`);
      continue;
    }

    console.log(`📝 Lesson ${lessonTyped.lesson_number}: ${lessonTyped.title}`);

    const questions = await generateQuizForLesson(
      lessonTyped.lesson_number,
      lessonTyped.title,
      transcription
    );

    if (questions.length > 0) {
      allQuizzes.push({
        lessonNumber: lessonTyped.lesson_number,
        lessonTitle: lessonTyped.title,
        questions
      });
      console.log(`  ✅ Generated ${questions.length} questions\n`);
    } else {
      console.log(`  ⚠️  No questions generated\n`);
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Generate text document
  let output = 'ТЕСТ ПО КУРСУ: ОСНОВЫ ТЕЙПИРОВАНИЯ\n';
  output += '=' .repeat(60) + '\n\n';

  for (const quiz of allQuizzes) {
    output += `УРОК ${quiz.lessonNumber}: ${quiz.lessonTitle}\n`;
    output += '-'.repeat(60) + '\n\n';

    quiz.questions.forEach((q, qIndex) => {
      output += `Вопрос ${qIndex + 1}:\n`;
      output += `${q.question}\n\n`;

      q.answers.forEach((answer, aIndex) => {
        const marker = answer.isCorrect ? '(правильный)' : '';
        output += `${String.fromCharCode(97 + aIndex)}) ${answer.text} ${marker}\n`;
      });

      output += '\n';
    });

    output += '\n';
  }

  // Save to file
  const outputPath = path.resolve(process.cwd(), 'taping-basics-quiz.txt');
  fs.writeFileSync(outputPath, output, 'utf-8');

  console.log(`\n✅ Quiz saved to: ${outputPath}`);
  console.log(`📊 Total: ${allQuizzes.length} lessons, ${allQuizzes.reduce((sum, q) => sum + q.questions.length, 0)} questions`);
}

generateTapingBasicsQuiz()
  .then(() => {
    console.log('\n✅ Complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
