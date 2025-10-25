#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  // Get course
  const { data: course } = await supabase
    .from('courses')
    .select('id')
    .eq('slug', 'taping-basics')
    .single();
  
  if (!course) {
    fs.writeFileSync('/tmp/progress.txt', 'Course not found');
    return;
  }

  // Get lessons
  const { data: lessons, count } = await supabase
    .from('lessons')
    .select('lesson_number, title, content', { count: 'exact' })
    .eq('course_id', course.id)
    .order('lesson_number');
  
  const withT = lessons?.filter(l => l.content?.transcript).length || 0;
  const percent = Math.round((withT / count) * 100);
  
  let output = '';
  output += '='.repeat(60) + '\n';
  output += 'ПРОГРЕСС ТРАНСКРИПЦИЙ - ОСНОВЫ ТЕЙПИРОВАНИЯ\n';
  output += '='.repeat(60) + '\n\n';
  output += `Всего уроков: ${count}\n`;
  output += `С транскриптами: ${withT}\n`;
  output += `Без транскриптов: ${count - withT}\n`;
  output += `Прогресс: ${withT}/${count} (${percent}%)\n\n`;
  output += '='.repeat(60) + '\n';
  output += 'ДЕТАЛИ ПО УРОКАМ:\n';
  output += '='.repeat(60) + '\n\n';
  
  lessons?.forEach(lesson => {
    const status = lesson.content?.transcript ? '✅' : '❌';
    const length = lesson.content?.transcript?.length || 0;
    const num = String(lesson.lesson_number).padStart(2, '0');
    output += `${status} Урок ${num}: ${lesson.title} (${length} симв.)\n`;
  });
  
  output += '\n' + '='.repeat(60) + '\n';
  output += `Обновлено: ${new Date().toLocaleString('ru-RU')}\n`;
  output += '='.repeat(60) + '\n';
  
  fs.writeFileSync('/tmp/progress.txt', output);
  console.log(output);
}

main().catch(e => {
  fs.writeFileSync('/tmp/progress.txt', 'Error: ' + e.message);
  console.error(e);
});
