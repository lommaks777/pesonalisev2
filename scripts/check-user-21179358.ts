import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUser21179358() {
  const userId = '21179358';
  
  console.log('🔍 Checking user 21179358...\n');

  // Check if profile exists
  console.log('📋 Checking profile...');
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_identifier', userId)
    .single();

  if (profileError) {
    console.error('❌ Profile error:', profileError);
    console.log('\n⚠️  Profile does NOT exist for this user!\n');
    console.log('This user needs to fill out the survey first!\n');
  } else {
    console.log('✅ Profile found:');
    console.log(`   ID: ${profile.id}`);
    console.log(`   Name: ${profile.name || 'NOT SET'}`);
    console.log(`   Course: ${profile.course_slug || 'NOT SET'}`);
    console.log(`   Survey data:`, profile.survey ? 'EXISTS' : 'MISSING');
    if (profile.survey) {
      console.log('\n📝 Survey data details:');
      console.log(JSON.stringify(profile.survey, null, 2));
    }
  }

  if (!profile) {
    console.log('\n⛔ Cannot continue - no profile exists\n');
    return;
  }

  // Check personalizations
  console.log('\n🎨 Checking personalized lesson descriptions...');
  const { data: personalizations, error: persError } = await supabase
    .from('personalized_lesson_descriptions')
    .select('*')
    .eq('profile_id', profile.id);

  if (persError) {
    console.error('❌ Personalizations error:', persError);
  } else {
    console.log(`Found ${personalizations?.length || 0} personalized lessons`);
    if (personalizations && personalizations.length > 0) {
      personalizations.forEach((p: any, idx: number) => {
        console.log(`  ${idx + 1}. Lesson ID: ${p.lesson_id}`);
      });
    } else {
      console.log('  ⚠️  No personalized lessons generated yet!');
    }
  }

  // Get taping-basics course info
  const courseSlug = profile.course_slug || 'taping-basics';
  console.log(`\n📖 Checking course: ${courseSlug}...`);
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('*')
    .eq('slug', courseSlug)
    .single();

  if (courseError) {
    console.error('❌ Course error:', courseError);
  } else {
    console.log(`✅ Course: ${course.title} (ID: ${course.id})`);

    // Get lesson 1
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select('*')
      .eq('course_id', course.id)
      .eq('lesson_number', 1)
      .single();

    if (lessonError) {
      console.error('❌ Lesson error:', lessonError);
    } else {
      console.log(`\n📝 Lesson 1: ${lesson.title}`);
      console.log(`   Lesson ID: ${lesson.id}`);
      
      // Check both transcription fields
      const directTranscription = lesson.transcription;
      const contentTranscription = (lesson.content as any)?.transcription;
      
      if (directTranscription) {
        console.log(`   Has transcription (direct field): YES ✅ (${directTranscription.length} chars)`);
      } else if (contentTranscription) {
        console.log(`   Has transcription (content JSON): YES ✅ (${contentTranscription.length} chars)`);
        console.log(`   ⚠️  Note: Transcription in legacy content.transcription field`);
      } else {
        console.log(`   Has transcription: NO ❌`);
      }
      
      console.log(`   Has default_description: ${lesson.default_description ? 'YES' : 'NO'}`);
      
      // Check if personalized version exists
      const { data: personalized } = await supabase
        .from('personalized_lesson_descriptions')
        .select('*')
        .eq('profile_id', profile.id)
        .eq('lesson_id', lesson.id)
        .maybeSingle();
      
      console.log(`   Has personalized version: ${personalized ? 'YES ✅' : 'NO ❌'}`);
      
      if (!personalized && (directTranscription || contentTranscription) && profile.survey) {
        console.log('\n💡 Recommendation: Generate personalization by calling /api/persona/block');
        console.log('   The transcription is available, personalization should work now!');
      }
    }
  }
}

checkUser21179358()
  .then(() => {
    console.log('\n✅ Check complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
