#!/usr/bin/env tsx
/**
 * Quick test: Generate one personalization to verify Russian language output
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { generatePersonalizedDescription } from '../lib/services/personalization-engine';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function main() {
  console.log('🧪 Testing Language Fix\n');
  
  // Get a lesson with transcript
  const { data: lesson } = await supabase
    .from('lessons')
    .select('id, lesson_number, title, content')
    .eq('course_id', (await supabase.from('courses').select('id').eq('slug', 'shvz').single()).data?.id)
    .eq('lesson_number', 1)
    .single();

  if (!lesson) {
    console.error('❌ Lesson not found');
    return;
  }

  const transcript = lesson.content?.transcription;
  if (!transcript) {
    console.error('❌ No transcript');
    return;
  }

  console.log(`📚 Testing with lesson: ${lesson.title}`);
  console.log(`📝 Transcript length: ${transcript.length} chars\n`);

  const testSurvey = {
    motivation: ['Хочу помогать людям'],
    target_clients: 'офисные работники',
    skills_wanted: 'массаж шеи и спины',
    fears: ['сделать больно клиенту'],
    wow_result: 'открыть свой массажный кабинет',
    practice_model: 'работа на дому'
  };

  console.log('🤖 Generating personalization...\n');
  const startTime = Date.now();

  try {
    const result = await generatePersonalizedDescription(
      lesson.id,
      transcript,
      { lesson_number: lesson.lesson_number, title: lesson.title },
      testSurvey,
      'Тестовый Пользователь'
    );

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ Generated in ${duration}s\n`);

    // Check language
    const intro = result.introduction;
    const hasRussian = /[А-Яа-яЁё]/.test(intro);
    const hasEnglish = /[A-Za-z]/.test(intro);

    console.log('='.repeat(80));
    console.log('\n📊 LANGUAGE CHECK:\n');
    
    if (hasRussian && !(/^[A-Za-z\s]+$/.test(intro.substring(0, 50)))) {
      console.log('✅ PASS: Content is in RUSSIAN');
    } else if (hasEnglish && !hasRussian) {
      console.log('🔴 FAIL: Content is in ENGLISH');
    } else {
      console.log('❓ UNKNOWN: Mixed or unclear language');
    }

    console.log(`\n📝 Introduction preview:\n"${intro.substring(0, 200)}..."\n`);
    
    console.log('📊 Content structure:');
    console.log(`  - introduction: ${result.introduction.length} chars`);
    console.log(`  - why_it_matters_for_you: ${result.why_it_matters_for_you.length} chars`);
    console.log(`  - key_takeaways: ${result.key_takeaways.length} items`);
    console.log(`  - practical_application: ${result.practical_application.length} chars`);
    console.log(`  - addressing_fears: ${result.addressing_fears.length} chars`);
    console.log(`  - personalized_homework: ${result.personalized_homework.length} chars`);
    console.log(`  - motivational_quote: ${result.motivational_quote.length} chars`);

    console.log('\n' + '='.repeat(80));
    
    if (hasRussian) {
      console.log('\n✅ FIX SUCCESSFUL: Language is correct!');
    } else {
      console.log('\n🔴 FIX FAILED: Still generating in English');
      console.log('\nNext steps:');
      console.log('  1. Check OpenAI API account settings');
      console.log('  2. Verify API key is correct');
      console.log('  3. Check for OpenAI API recent changes');
    }

  } catch (error) {
    console.error('\n❌ Error generating personalization:', error);
  }
}

main();
