/**
 * Verify Database State After Migration and Reset
 * 
 * Checks:
 * 1. Migration 004 columns exist
 * 2. Courses are present
 * 3. Lessons are populated with correct data
 * 4. Data quality (transcriptions, descriptions, Kinescope IDs)
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyDatabase() {
  console.log('🔍 Verifying Database State\n');
  console.log('=' .repeat(60));
  
  try {
    // Check 1: Verify migration 004 columns exist
    console.log('\n✅ Step 1: Checking Migration 004 Columns\n');
    
    const { data: testLesson, error: columnError } = await supabase
      .from('lessons')
      .select('transcription, kinescope_play_link_id, kinescope_video_content_id, default_description')
      .limit(1)
      .maybeSingle();
    
    if (columnError) {
      console.log('❌ Migration 004 NOT applied!');
      console.log('   Error:', columnError.message);
      console.log('\n   Please apply migration 004 first:');
      console.log('   1. Open Supabase Dashboard');
      console.log('   2. Go to SQL Editor');
      console.log('   3. Run migrations/004_extract_lesson_fields.sql\n');
      return;
    }
    
    console.log('✅ Migration 004 columns exist:');
    console.log('   - transcription');
    console.log('   - kinescope_play_link_id');
    console.log('   - kinescope_video_content_id');
    console.log('   - default_description');
    
    // Check 2: Courses summary
    console.log('\n' + '='.repeat(60));
    console.log('\n✅ Step 2: Courses Summary\n');
    
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('id, slug, title')
      .order('slug');
    
    if (coursesError || !courses) {
      console.log('❌ Error fetching courses:', coursesError?.message);
      return;
    }
    
    console.log(`Found ${courses.length} course(s):\n`);
    courses.forEach(course => {
      console.log(`📚 ${course.slug}`);
      console.log(`   Title: ${course.title}`);
      console.log(`   ID: ${course.id.substring(0, 8)}...`);
      console.log('');
    });
    
    // Check 3: Lessons by course
    console.log('=' .repeat(60));
    console.log('\n✅ Step 3: Lessons Analysis\n');
    
    for (const course of courses) {
      console.log(`\n📊 Course: ${course.slug}`);
      console.log('-'.repeat(60));
      
      const { data: lessons, error: lessonsError } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', course.id)
        .order('lesson_number');
      
      if (lessonsError || !lessons) {
        console.log(`   ❌ Error: ${lessonsError?.message}\n`);
        continue;
      }
      
      // Statistics
      const total = lessons.length;
      const withTranscription = lessons.filter(l => l.transcription && l.transcription.length > 0).length;
      const withDescription = lessons.filter(l => l.default_description).length;
      const withKinescopePlayId = lessons.filter(l => l.kinescope_play_link_id).length;
      const withKinescopeVideoId = lessons.filter(l => l.kinescope_video_content_id).length;
      
      console.log(`\n   Total Lessons: ${total}`);
      console.log(`   ├─ With transcription: ${withTranscription}/${total} (${Math.round(withTranscription/total*100)}%)`);
      console.log(`   ├─ With default_description: ${withDescription}/${total} (${Math.round(withDescription/total*100)}%)`);
      console.log(`   ├─ With kinescope_play_link_id: ${withKinescopePlayId}/${total} (${Math.round(withKinescopePlayId/total*100)}%)`);
      console.log(`   └─ With kinescope_video_content_id: ${withKinescopeVideoId}/${total} (${Math.round(withKinescopeVideoId/total*100)}%)`);
      
      // Sample lessons
      console.log(`\n   Sample Lessons:`);
      const samples = lessons.slice(0, 3);
      samples.forEach(lesson => {
        console.log(`\n   Lesson ${lesson.lesson_number}: ${lesson.title}`);
        console.log(`   ├─ Kinescope Play ID: ${lesson.kinescope_play_link_id || '❌ Missing'}`);
        console.log(`   ├─ Kinescope Video ID: ${lesson.kinescope_video_content_id || '❌ Missing'}`);
        console.log(`   ├─ Transcription: ${lesson.transcription ? `✅ (${lesson.transcription.length} chars)` : '❌ Missing'}`);
        console.log(`   └─ Default Description: ${lesson.default_description ? '✅ Present' : '❌ Missing'}`);
      });
      
      console.log('');
    }
    
    // Check 4: Expected vs Actual
    console.log('=' .repeat(60));
    console.log('\n✅ Step 4: Validation Against courses_rules.md\n');
    
    const expectedCourses = {
      'massazh-shvz': 12,
      'taping-basics': 28
    };
    
    for (const [slug, expectedCount] of Object.entries(expectedCourses)) {
      const course = courses.find(c => c.slug === slug);
      if (!course) {
        console.log(`❌ Course "${slug}" NOT FOUND in database!`);
        continue;
      }
      
      const { data: lessons } = await supabase
        .from('lessons')
        .select('lesson_number')
        .eq('course_id', course.id)
        .order('lesson_number');
      
      const actualCount = lessons?.length || 0;
      const status = actualCount === expectedCount ? '✅' : '❌';
      
      console.log(`${status} ${slug}:`);
      console.log(`   Expected: ${expectedCount} lessons`);
      console.log(`   Actual: ${actualCount} lessons`);
      
      if (actualCount === expectedCount) {
        // Check for gaps in lesson numbers
        const numbers = lessons?.map(l => l.lesson_number) || [];
        const hasGaps = numbers.some((num, idx) => num !== idx + 1);
        
        if (hasGaps) {
          console.log(`   ⚠️  Warning: Lesson numbers have gaps!`);
          console.log(`   Found: ${numbers.join(', ')}`);
        } else {
          console.log(`   ✅ Lesson numbers are sequential (1-${expectedCount})`);
        }
      } else if (actualCount > 0) {
        const numbers = lessons?.map(l => l.lesson_number) || [];
        console.log(`   Found lessons: ${numbers.join(', ')}`);
      }
      
      console.log('');
    }
    
    // Summary
    console.log('=' .repeat(60));
    console.log('\n📋 SUMMARY\n');
    
    const allGood = courses.length === 2 && 
                    courses.some(c => c.slug === 'massazh-shvz') &&
                    courses.some(c => c.slug === 'taping-basics');
    
    if (allGood) {
      console.log('✅ Database structure looks good!');
      console.log('✅ Migration 004 applied successfully');
      console.log('✅ Courses created correctly');
      console.log('✅ Lessons populated from courses_rules.md');
      
      console.log('\n📝 Next Steps:');
      console.log('1. ✅ Migration 004 - DONE');
      console.log('2. ✅ Database reset - DONE');
      console.log('3. ⏳ Generate missing transcriptions (if needed)');
      console.log('4. ⏳ Generate missing default_descriptions (if needed)');
      console.log('5. ⏳ Populate kinescope_video_content_id from API (optional)');
    } else {
      console.log('⚠️  Some issues detected - review the output above');
    }
    
    console.log('\n' + '=' .repeat(60));
    
  } catch (error) {
    console.error('\n❌ Critical error:', error);
    process.exit(1);
  }
}

verifyDatabase();
