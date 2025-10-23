/**
 * Upload lesson templates from JSON files to database
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import fs from 'fs';
import path from 'path';

async function uploadTemplates(courseSlug: string) {
  console.log(`\n📤 Загрузка шаблонов для курса: ${courseSlug}\n`);

  // Initialize Supabase
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase credentials not found');
  }
  
  const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
    auth: { persistSession: false }
  });

  // Get course
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('id, title')
    .eq('slug', courseSlug)
    .single();

  if (courseError || !course) {
    throw new Error(`Course not found: ${courseSlug}`);
  }

  console.log(`✅ Course: "${(course as any).title}"\n`);

  // Read template files
  const templatesDir = path.join(process.cwd(), 'store', courseSlug, 'templates');
  
  if (!fs.existsSync(templatesDir)) {
    throw new Error(`Templates directory not found: ${templatesDir}`);
  }

  const files = fs.readdirSync(templatesDir).filter(f => f.endsWith('-template.json'));
  
  if (files.length === 0) {
    console.log('⚠️  No template files found\n');
    return;
  }

  console.log(`Found ${files.length} template files\n`);

  let successful = 0;
  let failed = 0;

  for (const file of files) {
    // Extract lesson number from filename (lesson-01-template.json -> 1)
    const match = file.match(/lesson-(\d+)-template\.json/);
    if (!match) {
      console.log(`⚠️  Skipping ${file} (invalid format)`);
      continue;
    }

    const lessonNumber = parseInt(match[1], 10);
    const filePath = path.join(templatesDir, file);

    console.log(`📝 Lesson ${lessonNumber}:`);

    try {
      // Read template
      const templateContent = fs.readFileSync(filePath, 'utf8');
      const template = JSON.parse(templateContent);

      // Find lesson in database
      const { data: lesson, error: lessonError } = await supabase
        .from('lessons')
        .select('id, title, content')
        .eq('course_id', (course as any).id)
        .eq('lesson_number', lessonNumber)
        .maybeSingle();

      if (lessonError || !lesson) {
        console.log(`   ❌ Lesson not found in database`);
        failed++;
        continue;
      }

      const lessonTyped = lesson as any;
      console.log(`   📚 "${lessonTyped.title}"`);

      // Update lesson with template
      const updatedContent = {
        ...(lessonTyped.content || {}),
        template: template
      };

      // @ts-ignore - Supabase type issues
      const { error: updateError } = await supabase
        .from('lessons')
        .update({ content: updatedContent } as any)
        .eq('id', lessonTyped.id);

      if (updateError) {
        console.log(`   ❌ Failed to update: ${updateError.message}`);
        failed++;
      } else {
        console.log(`   ✅ Template uploaded to database`);
        successful++;
      }

    } catch (error: any) {
      console.log(`   ❌ Error: ${error.message}`);
      failed++;
    }

    console.log('');
  }

  console.log('='.repeat(70));
  console.log('📊 SUMMARY');
  console.log('='.repeat(70));
  console.log(`Total: ${files.length}`);
  console.log(`✅ Success: ${successful}`);
  console.log(`❌ Failed: ${failed}`);
  console.log('='.repeat(70) + '\n');
}

// Main
const courseSlug = process.argv[2];

if (!courseSlug) {
  console.error('\n❌ Usage: npx tsx --env-file=.env.local scripts/upload-templates-to-db.ts <course-slug>\n');
  process.exit(1);
}

uploadTemplates(courseSlug)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n💥 Error:', error.message);
    process.exit(1);
  });
