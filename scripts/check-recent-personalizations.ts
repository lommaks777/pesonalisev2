import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkRecentPersonalizations() {
  console.log('=== Checking Recent Personalizations ===\n');
  
  const { data, error } = await supabase
    .from('personalizations')
    .select('id, profile_id, lesson_id, created_at, content')
    .order('created_at', { ascending: false })
    .limit(15);
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log(`Total recent personalizations: ${data?.length}\n`);
  
  data?.forEach((p: any, i: number) => {
    console.log(`${i + 1}. Created: ${p.created_at}`);
    console.log(`   Lesson ID: ${p.lesson_id}`);
    console.log(`   Content keys: ${Object.keys(p.content || {}).join(', ')}`);
    
    if (p.content) {
      // Check if content has data
      const hasIntroduction = p.content.introduction && p.content.introduction.length > 0;
      const hasKeyPoints = p.content.key_points && p.content.key_points.length > 0;
      
      console.log(`   Has introduction: ${hasIntroduction ? '✅' : '❌'}`);
      console.log(`   Has key_points: ${hasKeyPoints ? '✅' : '❌'}`);
      
      if (p.content.introduction) {
        const intro = p.content.introduction;
        const isEnglish = /^[A-Za-z\s]+$/.test(intro.substring(0, 50));
        const hasRussian = /[А-Яа-яЁё]/.test(intro);
        
        console.log(`   Language: ${hasRussian ? '✅ Russian' : (isEnglish ? '🔴 ENGLISH' : '❓ Unknown')}`);
        console.log(`   Preview: ${intro.substring(0, 100)}...`);
      }
    }
    console.log('');
  });
  
  // Check specific user
  console.log('\n=== Checking User 324842722 ===\n');
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('getcourse_user_id', '324842722')
    .single();
  
  if (profileError) {
    console.log('Profile not found or error:', profileError.message);
  } else {
    console.log(`Profile found: ${profile.name}`);
    console.log(`Course: ${profile.course_slug}`);
    console.log(`Survey filled: ${profile.survey ? '✅' : '❌'}`);
    
    const { data: userPersonalizations } = await supabase
      .from('personalizations')
      .select('*')
      .eq('profile_id', profile.id)
      .order('created_at', { ascending: false });
    
    console.log(`Total personalizations: ${userPersonalizations?.length || 0}\n`);
    
    if (userPersonalizations && userPersonalizations.length > 0) {
      userPersonalizations.slice(0, 3).forEach((p: any, i: number) => {
        console.log(`Personalization ${i + 1}:`);
        console.log(`  Created: ${p.created_at}`);
        console.log(`  Content keys: ${Object.keys(p.content || {}).join(', ')}`);
        if (p.content?.introduction) {
          const hasRussian = /[А-Яа-яЁё]/.test(p.content.introduction);
          console.log(`  Language: ${hasRussian ? '✅ Russian' : '🔴 ENGLISH'}`);
          console.log(`  Preview: ${p.content.introduction.substring(0, 100)}...`);
        }
        console.log('');
      });
    }
  }
}

checkRecentPersonalizations().catch(console.error);
