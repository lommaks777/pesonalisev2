import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function main() {
  const userId = '469887216';
  
  console.log('🔍 Checking user:', userId);
  console.log('');
  
  // Check profile - first check how many exist
  const { data: allProfiles, error: allError } = await supabase
    .from('profiles')
    .select('id, user_identifier, name, course_slug, survey, created_at')
    .eq('user_identifier', userId);
  
  console.log('Found profiles:', allProfiles?.length || 0);
  if (allProfiles && allProfiles.length > 1) {
    console.log('⚠️  MULTIPLE PROFILES FOUND:');
    allProfiles.forEach((p, i) => {
      console.log(`   ${i + 1}. ID: ${p.id}, Name: ${p.name}, Course: ${p.course_slug}, Created: ${p.created_at}, Has survey: ${!!p.survey}`);
    });
  }
  
  // Get first one
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, user_identifier, name, course_slug, survey')
    .eq('user_identifier', userId)
    .limit(1)
    .single();
  
  console.log('=== PROFILE ===');
  if (profileError) {
    console.log('❌ Error:', profileError.message);
  } else if (!profile) {
    console.log('❌ Profile NOT found');
  } else {
    console.log('✅ Profile found');
    console.log('   ID:', profile.id);
    console.log('   Name:', profile.name || 'NULL');
    console.log('   Course:', profile.course_slug || 'NULL');
    console.log('   Has survey:', !!profile.survey);
    
    if (profile.survey) {
      console.log('\n=== SURVEY DATA ===');
      const survey = profile.survey as any;
      console.log('   Keys:', Object.keys(survey).join(', '));
      console.log('   Real name:', survey.real_name);
      console.log('   Course:', survey.course);
      console.log('   Target clients:', survey.target_clients);
      console.log('   Practice model:', survey.practice_model);
    } else {
      console.log('   ⚠️  Survey is NULL or empty!');
    }
  }
  
  // Check lesson 2
  console.log('\n=== LESSON 2 ===');
  const { data: lesson } = await supabase
    .from('lessons')
    .select('id, title, lesson_number, course_id, transcription, content, default_description')
    .eq('lesson_number', 2)
    .eq('course_id', 'bc345bd7-337e-48c7-8be5-4f312b6b4c29')
    .maybeSingle();
  
  if (!lesson) {
    console.log('❌ Lesson 2 NOT found');
  } else {
    console.log('✅ Lesson found:', lesson.title);
    console.log('   Direct transcription:', lesson.transcription ? `${lesson.transcription.length} chars` : 'NULL');
    const contentTranscription = (lesson.content as any)?.transcription;
    console.log('   Content.transcription:', contentTranscription ? `${contentTranscription.length} chars` : 'NULL');
    console.log('   Default description:', lesson.default_description ? 'EXISTS' : 'NULL');
  }
  
  // Check if personalization exists
  if (profile && lesson) {
    console.log('\n=== PERSONALIZATION ===');
    const { data: pers } = await supabase
      .from('personalized_lesson_descriptions')
      .select('id, created_at')
      .eq('profile_id', profile.id)
      .eq('lesson_id', lesson.id)
      .maybeSingle();
    
    if (pers) {
      console.log('✅ Personalization EXISTS (created:', pers.created_at, ')');
    } else {
      console.log('❌ Personalization NOT found - will be auto-generated on next request');
    }
  }
}

main().catch(console.error);
