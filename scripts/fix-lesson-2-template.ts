/**
 * Скрипт для исправления шаблона урока 2 курса "Массаж ШВЗ"
 * 
 * Проблема: урок 2 в БД имеет шаблон от урока 11 (постизометрическая релаксация)
 * Решение: найти правильный урок "Мышцы, с которыми мы будем работать" и обновить
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Переменные окружения не настроены!');
  console.log('Убедитесь, что NEXT_PUBLIC_SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY заданы');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function main() {
  console.log('🔍 Проверка урока 2 курса "Массаж ШВЗ"...\n');
  
  // 1. Найти курс
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('id, slug, title')
    .eq('slug', 'massazh-shvz')
    .single();
  
  if (courseError || !course) {
    console.error('❌ Курс не найден:', courseError);
    return;
  }
  
  console.log('✅ Курс найден:', course.title);
  console.log('');
  
  // 2. Получить все уроки
  const { data: lessons } = await supabase
    .from('lessons')
    .select('id, lesson_number, title, content')
    .eq('course_id', course.id)
    .order('lesson_number');
  
  console.log('📖 Уроки курса:');
  lessons?.forEach(l => {
    console.log(`  ${l.lesson_number}. ${l.title}`);
  });
  console.log('');
  
  // 3. Найти урок 2
  const lesson2 = lessons?.find(l => l.lesson_number === 2);
  if (!lesson2) {
    console.error('❌ Урок 2 не найден');
    return;
  }
  
  console.log('🔍 Текущий урок 2:');
  console.log('  Название:', lesson2.title);
  if (lesson2.content?.template) {
    const intro = lesson2.content.template['👋 Введение'] || lesson2.content.template.introduction;
    console.log('  Введение:', intro);
  }
  console.log('');
  
  // 4. Найти правильный урок про мышцы
  const musclesLesson = lessons?.find(l => 
    l.title.toLowerCase().includes('мышц') || 
    l.title.toLowerCase().includes('теория')
  );
  
  if (!musclesLesson) {
    console.log('⚠️ Урок про мышцы не найден в БД');
    console.log('Нужно импортировать правильный урок из файловой системы');
    return;
  }
  
  console.log('✅ Найден правильный урок про мышцы:');
  console.log('  Номер:', musclesLesson.lesson_number);
  console.log('  Название:', musclesLesson.title);
  if (musclesLesson.content?.template) {
    const intro = musclesLesson.content.template['👋 Введение'] || musclesLesson.content.template.introduction;
    console.log('  Введение:', intro);
  }
  console.log('');
  
  // 5. Спросить подтверждение
  console.log('❓ Хотите поменять шаблоны местами?');
  console.log(`   Урок ${lesson2.lesson_number} получит шаблон от урока ${musclesLesson.lesson_number}`);
  console.log(`   Урок ${musclesLesson.lesson_number} получит шаблон от урока ${lesson2.lesson_number}`);
  console.log('');
  console.log('Для выполнения запустите с флагом --fix');
  
  if (process.argv.includes('--fix')) {
    console.log('🔄 Обновление шаблонов...');
    
    // Поменять шаблоны местами
    const lesson2OldTemplate = lesson2.content?.template;
    const musclesTemplate = musclesLesson.content?.template;
    
    // Обновить урок 2
    const { error: update2Error } = await supabase
      .from('lessons')
      .update({
        content: {
          ...lesson2.content,
          template: musclesTemplate
        }
      })
      .eq('id', lesson2.id);
    
    if (update2Error) {
      console.error('❌ Ошибка обновления урока 2:', update2Error);
      return;
    }
    
    console.log('✅ Урок 2 обновлён');
    
    // Обновить урок про постизометрическую релаксацию
    const { error: updateMusclesError } = await supabase
      .from('lessons')
      .update({
        content: {
          ...musclesLesson.content,
          template: lesson2OldTemplate
        }
      })
      .eq('id', musclesLesson.id);
    
    if (updateMusclesError) {
      console.error('❌ Ошибка обновления урока про мышцы:', updateMusclesError);
      return;
    }
    
    console.log(`✅ Урок ${musclesLesson.lesson_number} обновлён`);
    console.log('');
    console.log('🎉 Шаблоны успешно исправлены!');
  }
}

main().catch(console.error);
