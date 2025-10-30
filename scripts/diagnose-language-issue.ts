#!/usr/bin/env tsx
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function main() {
  console.log('🔍 Diagnosing Language Issue in Recent Personalizations\n');
  console.log('='.repeat(80));
  
  // 1. Check recent personalizations
  const { data: recentPersonalizations, error } = await supabase
    .from('personalizations')
    .select('id, profile_id, lesson_id, created_at, content')
    .order('created_at', { ascending: false })
    .limit(15);

  if (error) {
    console.error('❌ Error fetching personalizations:', error);
    return;
  }

  if (!recentPersonalizations || recentPersonalizations.length === 0) {
    console.log('❌ No personalizations found');
    return;
  }

  console.log(`📊 Found ${recentPersonalizations.length} recent personalizations\n`);

  let englishCount = 0;
  let russianCount = 0;
  let incompleteCount = 0;

  for (const pers of recentPersonalizations) {
    const content = pers.content as any;
    const createdAt = new Date(pers.created_at);
    
    // Get profile info
    const { data: profile } = await supabase
      .from('profiles')
      .select('name, getcourse_user_id')
      .eq('id', pers.profile_id)
      .single();

    console.log(`\n${'─'.repeat(80)}`);
    console.log(`📅 Created: ${createdAt.toLocaleString()}`);
    console.log(`👤 User: ${profile?.name || 'Unknown'} (ID: ${profile?.getcourse_user_id || 'N/A'})`);
    
    if (!content || typeof content !== 'object') {
      console.log('❌ INVALID: Content is empty or not an object');
      incompleteCount++;
      continue;
    }

    const keys = Object.keys(content);
    console.log(`🔑 Content keys (${keys.length}): ${keys.join(', ')}`);

    // Check introduction field
    if (content.introduction) {
      const intro = content.introduction;
      const length = intro.length;
      const hasRussian = /[А-Яа-яЁё]/.test(intro);
      const hasEnglish = /[A-Za-z]/.test(intro);
      const firstChars = intro.substring(0, 100);
      
      if (!hasRussian && hasEnglish) {
        console.log(`🔴 LANGUAGE: ENGLISH (no Russian characters detected)`);
        englishCount++;
      } else if (hasRussian) {
        console.log(`✅ LANGUAGE: Russian`);
        russianCount++;
      } else {
        console.log(`❓ LANGUAGE: Unknown`);
      }

      console.log(`📏 Length: ${length} characters`);
      console.log(`📝 Preview: "${firstChars}${length > 100 ? '...' : ''}"`);
      
      // Check for completeness
      const expectedFields = [
        'introduction',
        'why_it_matters_for_you',
        'key_takeaways',
        'practical_application',
        'addressing_fears',
        'personalized_homework',
        'motivational_quote'
      ];
      
      const missingFields = expectedFields.filter(field => !content[field] || content[field]?.length === 0);
      
      if (missingFields.length > 0) {
        console.log(`⚠️  INCOMPLETE: Missing fields: ${missingFields.join(', ')}`);
        incompleteCount++;
      } else {
        console.log(`✅ COMPLETE: All 7 fields present`);
      }
      
      // Check key_takeaways format
      if (content.key_takeaways) {
        if (Array.isArray(content.key_takeaways)) {
          console.log(`   key_takeaways: Array with ${content.key_takeaways.length} items`);
        } else {
          console.log(`   ⚠️  key_takeaways is not an array: ${typeof content.key_takeaways}`);
        }
      }
    } else {
      console.log(`❌ INVALID: No introduction field`);
      incompleteCount++;
    }
  }

  // Summary
  console.log(`\n${'='.repeat(80)}`);
  console.log(`\n📊 SUMMARY:\n`);
  console.log(`Total checked: ${recentPersonalizations.length}`);
  console.log(`✅ Russian: ${russianCount}`);
  console.log(`🔴 English: ${englishCount}`);
  console.log(`⚠️  Incomplete: ${incompleteCount}`);
  
  if (englishCount > 0) {
    console.log(`\n🚨 PROBLEM DETECTED: ${englishCount} personalizations in English!`);
    console.log(`\nPossible causes:`);
    console.log(`  1. OpenAI API account language settings`);
    console.log(`  2. System prompt not being applied correctly`);
    console.log(`  3. Recent OpenAI API changes`);
    console.log(`  4. Temperature/model settings`);
    console.log(`\nRecommended actions:`);
    console.log(`  1. Check OpenAI API logs/settings`);
    console.log(`  2. Verify system prompt is in Russian`);
    console.log(`  3. Add explicit language instruction in prompt`);
    console.log(`  4. Test with manual API call`);
  }
  
  if (incompleteCount > 0) {
    console.log(`\n⚠️  WARNING: ${incompleteCount} incomplete personalizations!`);
    console.log(`\nPossible causes:`);
    console.log(`  1. AI generation failed/timeout`);
    console.log(`  2. JSON parsing errors`);
    console.log(`  3. Validation issues`);
  }
}

main().catch(console.error);
