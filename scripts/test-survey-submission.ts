/**
 * Тестовый скрипт для проверки сохранения анкеты
 * Симулирует что приходит от GetCourse
 */

const API_URL = 'http://localhost:3000/api/survey';

// Сценарий 1: GetCourse передаёт email в переменной uid, а имя в анкете
async function testScenario1() {
  console.log('\n=== ТЕСТ 1: Email в UID, имя в анкете ===\n');
  
  const surveyData = {
    uid: 'test@example.com',        // ← GetCourse передаёт email
    real_name: 'Тестовый Пользователь',  // ← Имя из анкеты
    course: 'taping-basics',
    motivation: 'Тестирование',
    fears: 'Нет страхов',
    target_clients: 'Тестовые клиенты',
    skills_wanted: 'Тестовые навыки',
    practice_model: 'тестовая модель',
    wow_result: 'тестовый результат'
  };
  
  console.log('Отправляем данные:');
  console.log('  uid:', surveyData.uid);
  console.log('  real_name:', surveyData.real_name);
  console.log('');
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(surveyData)
    });
    
    const result = await response.json();
    
    console.log('Ответ сервера:');
    console.log('  Status:', response.status);
    console.log('  Success:', result.success);
    console.log('  Profile ID:', result.profileId);
    console.log('  User Identifier:', result.userIdentifier);
    
    // Проверяем что записалось в базу
    if (result.profileId) {
      console.log('\n✅ Профиль создан');
      console.log('Ожидаем:');
      console.log('  user_identifier: "test@example.com"');
      console.log('  name: "Тестовый Пользователь"');
    }
    
    return result.profileId;
  } catch (error) {
    console.error('❌ Ошибка:', error);
    return null;
  }
}

// Сценарий 2: Обычный пользователь с нормальным ID
async function testScenario2() {
  console.log('\n=== ТЕСТ 2: Нормальный user ID ===\n');
  
  const surveyData = {
    uid: '987654321',
    real_name: 'Иван Иванов',
    course: 'taping-basics',
    motivation: 'Обучение',
    fears: 'Ошибки',
    target_clients: 'Все',
    skills_wanted: 'Все',
    practice_model: 'друг',
    wow_result: 'отличный результат'
  };
  
  console.log('Отправляем данные:');
  console.log('  uid:', surveyData.uid);
  console.log('  real_name:', surveyData.real_name);
  console.log('');
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(surveyData)
    });
    
    const result = await response.json();
    
    console.log('Ответ сервера:');
    console.log('  Status:', response.status);
    console.log('  Success:', result.success);
    console.log('  Profile ID:', result.profileId);
    console.log('  User Identifier:', result.userIdentifier);
    
    if (result.profileId) {
      console.log('\n✅ Профиль создан');
      console.log('Ожидаем:');
      console.log('  user_identifier: "987654321"');
      console.log('  name: "Иван Иванов"');
    }
    
    return result.profileId;
  } catch (error) {
    console.error('❌ Ошибка:', error);
    return null;
  }
}

// Проверка что записалось в базу
async function checkDatabase(profileId: string) {
  console.log(`\n=== ПРОВЕРКА БАЗЫ ДАННЫХ ===\n`);
  console.log(`Profile ID: ${profileId}`);
  console.log('');
  console.log('Выполните SQL запрос:');
  console.log(`SELECT user_identifier, name, course_slug, survey->>'real_name' as survey_name`);
  console.log(`FROM profiles WHERE id = '${profileId}';`);
  console.log('');
  console.log('Или используйте скрипт:');
  console.log(`npx tsx --env-file=.env.local -e "
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
const { data } = await supabase
  .from('profiles')
  .select('user_identifier, name, course_slug, survey')
  .eq('id', '${profileId}')
  .single();
console.log('user_identifier:', data.user_identifier);
console.log('name:', data.name);
console.log('survey.real_name:', data.survey?.real_name);
"`);
}

// Запуск тестов
async function main() {
  console.log('🧪 ТЕСТИРОВАНИЕ СОХРАНЕНИЯ АНКЕТЫ\n');
  console.log('=' .repeat(60));
  
  const profileId1 = await testScenario1();
  
  console.log('\n' + '='.repeat(60));
  
  const profileId2 = await testScenario2();
  
  console.log('\n' + '='.repeat(60));
  
  if (profileId1) {
    await checkDatabase(profileId1);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('\n✅ Тесты завершены\n');
}

main();
