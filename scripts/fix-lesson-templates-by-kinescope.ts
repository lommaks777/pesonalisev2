/**
 * Script to fix lesson templates based on courses_rules.md Kinescope URL mapping
 */

import * as fs from 'fs/promises';
import * as path from 'path';

// Mapping from courses_rules.md (lesson number -> Kinescope video ID)
const KINESCOPE_MAPPING = {
  1: 'qM9um324XRfRxWXKHDhm5c',
  2: '5NRs6UHWgMX9RtHqxNGy8j',
  3: 'bFfAsG1jaLsMLykc1TRryz',
  4: 'h5bu4F6D9Cwk3jBnXzLyjJ',
  5: 'wQstL7SozLXktKfyifWvxW',
  6: '4vQwt1kaYtKs4JxjSA2qoG',
  7: '7YxuJZVmvK6mwtdbcuK8nK',
  8: 'd4G4ufDWZPLafXAiffYgAQ',
  9: 'tMhuZuiZhHnfEJzVioZCZ8',
  10: 'iWdHFmJxuMAd9qAaaS9SW6',
  11: 'e4cRfmunSSzyLMxeeQtLeC',
  12: 'f6LtSgcbNfPb9nwngrR6Vo'
};

// Mapping of Kinescope ID to template file (found in store/shvz/*-final.json)
// Format: Kinescope ID -> template file number
const KINESCOPE_TO_TEMPLATE: Record<string, number> = {
  'qM9um324XRfRxWXKHDhm5c': 1,  // Lesson 1
  '5NRs6UHWgMX9RtHqxNGy8j': 2,  // Lesson 2 - Muscles
  'bFfAsG1jaLsMLykc1TRryz': 3,  // Lesson 3 - Diagnostics
  'h5bu4F6D9Cwk3jBnXzLyjJ': 11, // Lesson 4 - Trigger points (was in file 11)
  'wQstL7SozLXktKfyifWvxW': 5,  // Lesson 5
  '4vQwt1kaYtKs4JxjSA2qoG': 6,  // Lesson 6
  '7YxuJZVmvK6mwtdbcuK8nK': 7,  // Lesson 7
  'd4G4ufDWZPLafXAiffYgAQ': 8,  // Lesson 8
  'tMhuZuiZhHnfEJzVioZCZ8': 9,  // Lesson 9
  'iWdHFmJxuMAd9qAaaS9SW6': 10, // Lesson 10
  'e4cRfmunSSzyLMxeeQtLeC': 4,  // Lesson 11 - Post-isometric relaxation (was in file 4)
  'f6LtSgcbNfPb9nwngrR6Vo': 12  // Lesson 12
};

async function fixLessonTemplates() {
  console.log('🔧 Fixing lesson templates based on courses_rules.md mapping...\n');
  
  const shvzDir = path.join(process.cwd(), 'store', 'shvz');
  const lessonsDir = path.join(shvzDir, 'lessons');
  
  // Load all template files
  const files = await fs.readdir(shvzDir);
  const templateFiles = files.filter(f => f.match(/^\d+-.*-final\.json$/));
  
  // Map template number to template content
  const templatesByNumber = new Map<number, any>();
  
  for (const file of templateFiles) {
    const match = file.match(/^(\d+)-/);
    if (match) {
      const templateNum = parseInt(match[1]);
      const filePath = path.join(shvzDir, file);
      const content = await fs.readFile(filePath, 'utf-8');
      const template = JSON.parse(content);
      
      templatesByNumber.set(templateNum, template);
      console.log(`📄 Loaded template ${templateNum}: ${file}`);
    }
  }
  
  console.log('');
  
  // Update lesson.json files based on Kinescope mapping
  const folders = await fs.readdir(lessonsDir);
  const sortedFolders = folders.filter(f => /^\d+$/.test(f)).sort();
  
  let updated = 0;
  let skipped = 0;
  
  for (const folder of sortedFolders) {
    const lessonJsonPath = path.join(lessonsDir, folder, 'lesson.json');
    const content = await fs.readFile(lessonJsonPath, 'utf-8');
    const lesson = JSON.parse(content);
    
    const lessonNum = lesson.number;
    const kinescopeId = KINESCOPE_MAPPING[lessonNum as keyof typeof KINESCOPE_MAPPING];
    
    if (!kinescopeId) {
      console.log(`⚠️ Lesson ${lessonNum}: No Kinescope mapping found`);
      skipped++;
      continue;
    }
    
    const correctTemplateNum = KINESCOPE_TO_TEMPLATE[kinescopeId];
    
    if (!correctTemplateNum) {
      console.log(`⚠️ Lesson ${lessonNum}: Kinescope ${kinescopeId} not mapped to template`);
      skipped++;
      continue;
    }
    
    const template = templatesByNumber.get(correctTemplateNum);
    
    if (!template) {
      console.log(`⚠️ Lesson ${lessonNum}: Template ${correctTemplateNum} not found`);
      skipped++;
      continue;
    }
    
    // Update lesson.json
    lesson.description = { template };
    lesson.files = lesson.files || [];
    
    await fs.writeFile(lessonJsonPath, JSON.stringify(lesson, null, 4), 'utf-8');
    
    console.log(`✅ Lesson ${lessonNum} → Template ${correctTemplateNum} (Kinescope: ${kinescopeId})`);
    updated++;
  }
  
  console.log('');
  console.log('═'.repeat(80));
  console.log(`✅ Updated lessons: ${updated}`);
  console.log(`⚠️ Skipped lessons: ${skipped}`);
  console.log('═'.repeat(80));
  console.log('');
  
  if (updated > 0) {
    console.log('💡 Next step:');
    console.log('   npx tsx --env-file=.env.local scripts/import-lessons.ts');
    console.log('');
    console.log('   This will update the database with corrected templates.');
  }
}

fixLessonTemplates().catch(console.error);
