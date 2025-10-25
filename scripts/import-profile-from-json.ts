#!/usr/bin/env node
/**
 * Import user profile from JSON file to Supabase database
 * Usage: npx tsx --env-file=.env.local scripts/import-profile-from-json.ts <userId>
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface SurveyData {
  experience?: string;
  motivation?: string[];
  motivation_other?: string;
  target_clients?: string;
  skills_wanted?: string;
  fears?: string[];
  fears_other?: string;
  wow_result?: string;
  practice_model?: string;
}

interface UserProfile {
  user_id: string;
  name: string;
  lvl?: string | null;
  goal?: string | null;
  time?: string | null;
  format?: string | null;
  purpose?: string | null;
  survey: SurveyData;
  updated_at?: number;
}

async function importProfile(userId: string) {
  console.log(`🔍 Ищем профиль пользователя ${userId}...\n`);

  // 1. Read JSON file
  const jsonPath = path.join(process.cwd(), 'store', `${userId}.json`);
  
  let profileData: UserProfile;
  try {
    const content = await fs.readFile(jsonPath, 'utf-8');
    profileData = JSON.parse(content) as UserProfile;
    console.log(`✅ Файл найден: ${jsonPath}`);
    console.log(`   Имя: ${profileData.name}`);
    console.log(`   Мотивация: ${profileData.survey.motivation?.join(', ')}`);
    console.log(`   Целевые клиенты: ${profileData.survey.target_clients}\n`);
  } catch (error) {
    console.error(`❌ Ошибка чтения файла ${jsonPath}:`, error);
    console.error(`   Убедитесь, что файл существует в директории /store/\n`);
    process.exit(1);
  }

  // 2. Check if profile already exists
  const { data: existingProfile, error: checkError } = await supabase
    .from('profiles')
    .select('id, name')
    .eq('user_identifier', userId)
    .maybeSingle();

  if (checkError) {
    console.error('❌ Ошибка проверки профиля в БД:', checkError);
    process.exit(1);
  }

  if (existingProfile) {
    console.log(`⚠️  Профиль уже существует в базе данных:`);
    console.log(`   ID: ${existingProfile.id}`);
    console.log(`   Имя: ${existingProfile.name}`);
    console.log(`\n❓ Хотите обновить? (перезапустите с флагом --force)\n`);
    
    if (!process.argv.includes('--force')) {
      process.exit(0);
    }
    
    console.log('🔄 Обновляем существующий профиль...\n');
  }

  // 3. Prepare survey data (use existing survey object)
  const surveyData = profileData.survey;

  // 4. Insert or update profile
  const { data: profile, error: upsertError } = await supabase
    .from('profiles')
    .upsert(
      {
        user_identifier: userId,
        name: profileData.name,
        course_slug: 'kinesio2', // Default course for kinesio users
        survey: surveyData,
      },
      { 
        onConflict: 'user_identifier',
        ignoreDuplicates: false 
      }
    )
    .select()
    .single();

  if (upsertError) {
    console.error('❌ Ошибка сохранения профиля:', upsertError);
    process.exit(1);
  }

  console.log('✅ Профиль успешно импортирован!');
  console.log(`   ID: ${profile.id}`);
  console.log(`   Имя: ${profile.name}`);
  console.log(`   User Identifier: ${profile.user_identifier}`);
  console.log(`   Курс: ${profile.course_slug}`);
  console.log(`\n📊 Данные анкеты:`);
  console.log(`   Мотивация: ${surveyData.motivation?.join(', ')}`);
  console.log(`   Целевые клиенты: ${surveyData.target_clients}`);
  console.log(`   Желаемые навыки: ${surveyData.skills_wanted}`);
  console.log(`   Страхи: ${surveyData.fears?.join(', ') || surveyData.fears_other || 'не указаны'}`);
  console.log(`   WOW-результат: ${surveyData.wow_result}`);
  console.log(`   Модель практики: ${surveyData.practice_model}`);
  console.log(`\n✨ Теперь для пользователя ${userId} будет доступна персонализация!`);
}

async function main() {
  const userId = process.argv[2];
  
  if (!userId) {
    console.error('❌ Укажите ID пользователя:');
    console.error('   npx tsx --env-file=.env.local scripts/import-profile-from-json.ts <userId>');
    console.error('\nПример:');
    console.error('   npx tsx --env-file=.env.local scripts/import-profile-from-json.ts 21179358');
    console.error('\nДля обновления существующего профиля добавьте --force:');
    console.error('   npx tsx --env-file=.env.local scripts/import-profile-from-json.ts 21179358 --force');
    process.exit(1);
  }

  await importProfile(userId);
}

main();
