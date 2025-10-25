#!/usr/bin/env node
/**
 * Test multi-course survey functionality
 * 
 * This script will:
 * 1. Delete old profile 21179358 (if exists)
 * 2. Create test profile 12345 for course massazh-shvz
 * 3. Create test profile 12345 for course kinesio2
 * 4. Verify both profiles exist
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function testMultiCourseSurvey() {
  console.log('🧪 Testing Multi-Course Survey Functionality\n');

  // Step 1: Delete old incorrect profile
  console.log('1️⃣ Deleting old profile 21179358...');
  const { error: deleteError } = await supabase
    .from('profiles')
    .delete()
    .eq('user_identifier', '21179358');

  if (deleteError) {
    console.log(`   ⚠️  Error (expected if migration not applied): ${deleteError.message}`);
  } else {
    console.log('   ✅ Profile 21179358 deleted\n');
  }

  // Step 2: Create test profile for massazh-shvz
  console.log('2️⃣ Creating profile for user 12345 - Course: massazh-shvz...');
  const surveyMassage = {
    experience: "some",
    motivation: ["professional_development", "additional_income"],
    target_clients: "офисные работники с болями в шее",
    skills_wanted: "снимать головные боли и напряжение",
    fears: ["technique_fail", "hurt_client"],
    wow_result: "уверенно работать с шейно-воротниковой зоной",
    practice_model: "друзья и семья"
  };

  const { data: profile1, error: error1 } = await supabase
    .from('profiles')
    .upsert({
      user_identifier: '12345',
      name: 'Тестовый Пользователь',
      course_slug: 'massazh-shvz',
      survey: surveyMassage
    }, {
      onConflict: 'user_identifier,course_slug'
    })
    .select()
    .single();

  if (error1) {
    console.log(`   ❌ Error: ${error1.message}`);
    console.log(`   💡 This means migration was NOT applied yet!`);
    console.log(`   📝 Please apply migration manually in Supabase Dashboard\n`);
    
    // Try old method (will overwrite if migration not applied)
    console.log('   ⚠️  Trying old method (will work if migration NOT applied)...');
    const { data: oldProfile, error: oldError } = await supabase
      .from('profiles')
      .upsert({
        user_identifier: '12345',
        name: 'Тестовый Пользователь',
        course_slug: 'massazh-shvz',
        survey: surveyMassage
      })
      .select()
      .single();
    
    if (oldError) {
      console.log(`   ❌ Old method also failed: ${oldError.message}\n`);
      return;
    }
    
    console.log(`   ✅ Created with old method (only ONE profile per user)\n`);
  } else {
    console.log(`   ✅ Created profile ID: ${profile1.id}`);
    console.log(`   📊 Survey data: ${JSON.stringify(surveyMassage, null, 2).substring(0, 100)}...\n`);
  }

  // Step 3: Create test profile for kinesio2
  console.log('3️⃣ Creating profile for user 12345 - Course: kinesio2...');
  const surveyKinesio = {
    experience: "none",
    motivation: ["learn_new_skill", "help_clients"],
    target_clients: "спортсмены и люди с эстетическими запросами",
    skills_wanted: "правильно наклеивать тейпы для лица и тела",
    fears: ["wrong_application", "skin_irritation"],
    wow_result: "видимый эффект от тейпирования лица",
    practice_model: "клиенты в салоне"
  };

  const { data: profile2, error: error2 } = await supabase
    .from('profiles')
    .upsert({
      user_identifier: '12345',
      name: 'Тестовый Пользователь',
      course_slug: 'kinesio2',
      survey: surveyKinesio
    }, {
      onConflict: 'user_identifier,course_slug'
    })
    .select()
    .single();

  if (error2) {
    console.log(`   ❌ Error: ${error2.message}`);
    console.log(`   ⚠️  This is EXPECTED if migration was NOT applied!`);
    console.log(`   📝 With old schema, second course would OVERWRITE first course data\n`);
  } else {
    console.log(`   ✅ Created profile ID: ${profile2.id}`);
    console.log(`   📊 Survey data: ${JSON.stringify(surveyKinesio, null, 2).substring(0, 100)}...\n`);
  }

  // Step 4: Verify profiles
  console.log('4️⃣ Verifying profiles for user 12345...\n');
  const { data: allProfiles, error: verifyError } = await supabase
    .from('profiles')
    .select('id, user_identifier, course_slug, name, created_at')
    .eq('user_identifier', '12345')
    .order('created_at', { ascending: false });

  if (verifyError) {
    console.log(`   ❌ Error: ${verifyError.message}\n`);
    return;
  }

  if (!allProfiles || allProfiles.length === 0) {
    console.log('   ❌ No profiles found!\n');
    return;
  }

  console.log(`   📊 Found ${allProfiles.length} profile(s):\n`);
  allProfiles.forEach((p, i) => {
    console.log(`   ${i + 1}. Course: ${p.course_slug}`);
    console.log(`      ID: ${p.id}`);
    console.log(`      Name: ${p.name}`);
    console.log(`      Created: ${p.created_at}\n`);
  });

  // Result
  if (allProfiles.length === 1) {
    console.log('⚠️  RESULT: Only 1 profile exists');
    console.log('   This means migration was NOT applied yet!');
    console.log('   User can only have ONE profile (not multi-course)\n');
    console.log('📝 Action Required:');
    console.log('   Apply migration in Supabase Dashboard:');
    console.log('   /migrations/003_fix_multi_course_profiles.sql\n');
  } else if (allProfiles.length === 2) {
    console.log('✅ SUCCESS: 2 profiles exist!');
    console.log('   Migration was applied correctly!');
    console.log('   User can have multiple profiles (one per course)\n');
    
    // Check if both courses exist
    const courses = allProfiles.map(p => p.course_slug);
    if (courses.includes('massazh-shvz') && courses.includes('kinesio2')) {
      console.log('✅ Both courses confirmed:');
      console.log('   - massazh-shvz ✓');
      console.log('   - kinesio2 ✓\n');
    }
  }

  console.log('🎉 Test completed!');
}

testMultiCourseSurvey();
