/**
 * Reset and Populate All Courses from courses_rules.md
 * 
 * This script:
 * 1. Clears all lessons and personalizations from database
 * 2. Creates courses if they don't exist
 * 3. Populates lessons with correct data from courses_rules.md:
 *    - lesson_number
 *    - kinescope_play_link_id (from URL)
 *    - transcription (from .txt files if available)
 *    - default_description (from -final.json if available)
 * 
 * Usage: npx tsx --env-file=.env.local scripts/reset-and-populate-courses.ts
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Course definitions from courses_rules.md
const COURSES = {
  'massazh-shvz': {
    title: 'Массаж лица: ШВЗ',
    lessons: [
      { number: 1, kinescope_id: 'qM9um324XRfRxWXKHDhm5c' },
      { number: 2, kinescope_id: '5NRs6UHWgMX9RtHqxNGy8j' },
      { number: 3, kinescope_id: 'bFfAsG1jaLsMLykc1TRryz' },
      { number: 4, kinescope_id: 'h5bu4F6D9Cwk3jBnXzLyjJ' },
      { number: 5, kinescope_id: 'wQstL7SozLXktKfyifWvxW' },
      { number: 6, kinescope_id: '4vQwt1kaYtKs4JxjSA2qoG' },
      { number: 7, kinescope_id: '7YxuJZVmvK6mwtdbcuK8nK' },
      { number: 8, kinescope_id: 'd4G4ufDWZPLafXAiffYgAQ' },
      { number: 9, kinescope_id: 'tMhuZuiZhHnfEJzVioZCZ8' },
      { number: 10, kinescope_id: 'iWdHFmJxuMAd9qAaaS9SW6' },
      { number: 11, kinescope_id: 'e4cRfmunSSzyLMxeeQtLeC' },
      { number: 12, kinescope_id: 'f6LtSgcbNfPb9nwngrR6Vo' },
    ]
  },
  'taping-basics': {
    title: 'Тейпирование: Основы',
    lessons: [
      { number: 1, kinescope_id: 'bNY6pPPffmFwo1H72oxyD9' },
      { number: 2, kinescope_id: 'ar5FqAc81wPipZa6RBLPum' },
      { number: 3, kinescope_id: '3cHqMjFJhd48NdTfaNNfiW' },
      { number: 4, kinescope_id: 'fCvDw2LGkF9hYqLpJMcoU1' },
      { number: 5, kinescope_id: 'bHiAFM4vYNHdiuJ9LrcMTd' },
      { number: 6, kinescope_id: 'uMba5Jj93NiU4t6VeXTQAp' },
      { number: 7, kinescope_id: 'cWYnSWtEicYFpaPsMkWDPZ' },
      { number: 8, kinescope_id: '2mUfhdYCe2cK8Y5kYHBywY' },
      { number: 9, kinescope_id: 'm4gxZvbeSHmHAnqsLMteLf' },
      { number: 10, kinescope_id: 'whK5cgi4vm4M3ovrnsEbdN' },
      { number: 11, kinescope_id: '4RvVkqFxu7ZiPDyqnmD3AM' },
      { number: 12, kinescope_id: 'aUuMkKDfdE7en2zXWCBYkZ' },
      { number: 13, kinescope_id: 'tqGsKnpq8ySMwsTxN7i9Tg' },
      { number: 14, kinescope_id: 'ji29BdmeAPi8LayFPBsQDL' },
      { number: 15, kinescope_id: '8xW9NDLvx9bRNBPztHKcF8' },
      { number: 16, kinescope_id: 'gyn8Ei9vs6BYynnJgeqKvb' },
      { number: 17, kinescope_id: 'ik6apq7M4frtZ4YXoaxuWZ' },
      { number: 18, kinescope_id: '3f4KcD8x6eGYfcUVEMCuT1' },
      { number: 19, kinescope_id: '0hxMmnwQzn9u48zEGcp66A' },
      { number: 20, kinescope_id: '24WuQYuAsSvjTpp4HiSc1M' },
      { number: 21, kinescope_id: 'oRLMYfmCJGQSG3PiXVqd2F' },
      { number: 22, kinescope_id: 'ksEHv5HiAdXDnNEgfxkgUi' },
      { number: 23, kinescope_id: 'u885VcnFMA4ZqWV4oYuUEv' },
      { number: 24, kinescope_id: 'teF9HHjziZyeLaR52tvMj2' },
      { number: 25, kinescope_id: 'iezaPFnbh5MsroUvntYY45' },
      { number: 26, kinescope_id: 'iaghA2d3NvzH5tkBts7dd2' },
      { number: 27, kinescope_id: 'p54RFHCkYANqaJcebRTQVH' },
      { number: 28, kinescope_id: '2K4vNhqsTzBs5jL5Hg81Vq' },
    ]
  }
};

/**
 * Load transcription from .txt file
 */
function loadTranscription(courseSlug: string, lessonNumber: number): string | null {
  const storePath = path.join(process.cwd(), 'store', courseSlug);
  
  try {
    // Try to find .txt file matching lesson number
    const files = fs.readdirSync(storePath);
    const transcriptFile = files.find(f => 
      f.startsWith(`${lessonNumber}-`) && f.endsWith('.txt')
    );
    
    if (transcriptFile) {
      const content = fs.readFileSync(path.join(storePath, transcriptFile), 'utf-8');
      return content.trim();
    }
  } catch (error) {
    // Directory or file doesn't exist
  }
  
  return null;
}

/**
 * Load default description from -final.json file
 */
function loadDefaultDescription(courseSlug: string, lessonNumber: number): any {
  const storePath = path.join(process.cwd(), 'store', courseSlug);
  
  // Try multiple possible file patterns
  const patterns = [
    `${lessonNumber}-*-final.json`,
    `templates/lesson-${String(lessonNumber).padStart(2, '0')}-template.json`
  ];
  
  for (const pattern of patterns) {
    try {
      const fullPattern = pattern.includes('/') 
        ? path.join(storePath, pattern)
        : path.join(storePath, pattern);
      
      const dir = path.dirname(fullPattern);
      const filePattern = path.basename(fullPattern);
      
      if (!fs.existsSync(dir)) continue;
      
      const files = fs.readdirSync(dir);
      const jsonFile = files.find(f => {
        if (filePattern.includes('*')) {
          const regex = new RegExp('^' + filePattern.replace('*', '.*') + '$');
          return regex.test(f);
        }
        return f === filePattern;
      });
      
      if (jsonFile) {
        const content = fs.readFileSync(path.join(dir, jsonFile), 'utf-8');
        return JSON.parse(content);
      }
    } catch (error) {
      // Continue to next pattern
    }
  }
  
  return null;
}

/**
 * Main reset and populate function
 */
async function resetAndPopulate() {
  console.log('🔄 Starting Database Reset and Population\n');
  
  try {
    // Step 1: Clear all lessons and personalizations
    console.log('Step 1: Clearing existing data...');
    
    const { error: clearPersonalizationsError } = await supabase
      .from('personalized_lesson_descriptions')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (clearPersonalizationsError) {
      console.log('  Note:', clearPersonalizationsError.message);
    } else {
      console.log('  ✅ Cleared all personalizations');
    }
    
    const { error: clearLessonsError } = await supabase
      .from('lessons')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (clearLessonsError) {
      console.log('  Note:', clearLessonsError.message);
    } else {
      console.log('  ✅ Cleared all lessons');
    }
    
    console.log('');
    
    // Step 2: Create or get courses
    console.log('Step 2: Setting up courses...\n');
    
    for (const [slug, courseData] of Object.entries(COURSES)) {
      console.log(`📚 Course: ${slug}`);
      
      // Check if course exists
      const { data: existingCourse } = await supabase
        .from('courses')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();
      
      let courseId: string;
      
      if (existingCourse) {
        courseId = existingCourse.id;
        console.log(`  ✅ Course already exists (id: ${courseId.substring(0, 8)}...)`);
      } else {
        const { data: newCourse, error } = await supabase
          .from('courses')
          .insert({
            slug,
            title: courseData.title,
            description: `Course: ${courseData.title}`
          })
          .select('id')
          .single();
        
        if (error || !newCourse) {
          console.error(`  ❌ Failed to create course: ${error?.message}`);
          continue;
        }
        
        courseId = newCourse.id;
        console.log(`  ✅ Created course (id: ${courseId.substring(0, 8)}...)`);
      }
      
      // Step 3: Create lessons
      console.log(`  Creating ${courseData.lessons.length} lessons...`);
      
      let successCount = 0;
      let withTranscription = 0;
      let withDescription = 0;
      
      for (const lesson of courseData.lessons) {
        const transcription = loadTranscription(slug, lesson.number);
        const defaultDescription = loadDefaultDescription(slug, lesson.number);
        
        const lessonData = {
          course_id: courseId,
          lesson_number: lesson.number,
          title: `Урок ${lesson.number}`,
          kinescope_play_link_id: lesson.kinescope_id,
          transcription: transcription,
          default_description: defaultDescription,
          content: {} // Empty JSONB object
        };
        
        const { error: lessonError } = await supabase
          .from('lessons')
          .insert(lessonData);
        
        if (lessonError) {
          console.log(`  ❌ Lesson ${lesson.number}: ${lessonError.message}`);
        } else {
          successCount++;
          if (transcription) withTranscription++;
          if (defaultDescription) withDescription++;
        }
      }
      
      console.log(`  ✅ Created ${successCount}/${courseData.lessons.length} lessons`);
      console.log(`     - With transcription: ${withTranscription}`);
      console.log(`     - With default_description: ${withDescription}`);
      console.log('');
    }
    
    // Step 4: Verify results
    console.log('Step 4: Verification...\n');
    
    for (const [slug] of Object.entries(COURSES)) {
      const { data: lessons, error } = await supabase
        .from('lessons')
        .select('lesson_number, title, transcription, default_description, kinescope_play_link_id')
        .eq('course_id', (await supabase.from('courses').select('id').eq('slug', slug).single()).data?.id)
        .order('lesson_number');
      
      if (error) {
        console.error(`❌ Error verifying ${slug}:`, error.message);
      } else if (lessons) {
        console.log(`✅ ${slug}: ${lessons.length} lessons`);
        console.log(`   Sample lesson ${lessons[0]?.lesson_number}:`);
        console.log(`   - Title: ${lessons[0]?.title}`);
        console.log(`   - Kinescope ID: ${lessons[0]?.kinescope_play_link_id}`);
        console.log(`   - Has transcription: ${lessons[0]?.transcription ? '✅' : '❌'}`);
        console.log(`   - Has default_description: ${lessons[0]?.default_description ? '✅' : '❌'}`);
        console.log('');
      }
    }
    
    console.log('✅ Database reset and population complete!\n');
    console.log('📝 Next steps:');
    console.log('1. Check that migration 004 has been applied (new columns exist)');
    console.log('2. Generate missing transcriptions if needed');
    console.log('3. Generate missing default_descriptions if needed');
    
  } catch (error) {
    console.error('❌ Critical error:', error);
    process.exit(1);
  }
}

resetAndPopulate();
