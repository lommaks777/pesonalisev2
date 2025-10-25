#!/usr/bin/env node
/**
 * List all lessons in kinesio2 course
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function listLessons() {
  // 1. Get course
  const { data: course } = await supabase
    .from('courses')
    .select('id, slug, title')
    .eq('slug', 'kinesio2')
    .single();

  if (!course) {
    console.error('❌ Курс kinesio2 не найден');
    process.exit(1);
  }

  console.log(`✅ Курс: ${course.title}`);
  console.log(`   ID: ${course.id}\n`);

  // 2. Get all lessons
  const { data: lessons } = await supabase
    .from('lessons')
    .select('id, lesson_number, title, content')
    .eq('course_id', course.id)
    .order('lesson_number');

  if (!lessons || lessons.length === 0) {
    console.log('❌ Уроки не найдены');
    return;
  }

  console.log(`📚 Найдено уроков: ${lessons.length}\n`);
  console.log('╔═══╦═══════════════════════════════════════════════════════════════════════╗');
  console.log('║ № ║ Название                                                              ║');
  console.log('╠═══╬═══════════════════════════════════════════════════════════════════════╣');

  lessons.forEach((lesson) => {
    const num = String(lesson.lesson_number).padStart(2, ' ');
    const title = (lesson.title || 'Без названия').substring(0, 65).padEnd(65);
    const hasTranscript = lesson.content && (lesson.content as any).transcription ? '✓' : '✗';
    console.log(`║ ${num} ║ ${title} [${hasTranscript}] ║`);
  });

  console.log('╚═══╩═══════════════════════════════════════════════════════════════════════╝');
  console.log('\n[✓] = есть расшифровка | [✗] = нет расшифровки');
}

listLessons();
