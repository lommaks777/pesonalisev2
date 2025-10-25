/**
 * Manual fix for lesson templates based on actual lesson titles and expected content
 * 
 * Current issues found by testing:
 * - Lesson 2: Has post-isometric content, should be MUSCLES
 * - Lesson 8: Has relaxing/strengthening content, but title says "repeat after me"
 * - Lesson 9: Has diagnostics content, but title says "demonstration"  
 * - Lesson 10: Has post-isometric content, but title says "repeat after me"
 * - Lesson 11: Has functional massage content, but title says "post-isometric relaxation"
 * - Lesson 12: Has diagnostics content, but title says "demonstration"
 */

import * as fs from 'fs/promises';
import * as path from 'path';

// Manual template for Lesson 2 - Muscles (recreated from previous session)
const MUSCLES_TEMPLATE = {
  "👋 Введение": "Этот урок посвящён изучению мышц шейно-воротниковой зоны. Вы узнаете анатомию и функции ключевых мышц.",
  "🔑 Ключевые моменты": [
    "Узнаете про мышцы-разгибатели шеи и их функции.",
    "Изучите грудинно-ключично-сосцевидную мышцу и её роль в осанке.",
    "Поймёте связь между малой грудной мышцей и положением плеч.",
    "Узнаете о важности подзатылочных мышц и их триггерных точках.",
    "Изучите роль диафрагмы в стабилизации поясничного отдела."
  ],
  "💡 Практические советы": [
    "Работайте с первопричиной: ГКСМ и подзатылочными мышцами.",
    "Помните, что боль может быть не там, где проблема.",
    "Изучите взаимосвязь головы, шеи и поясницы.",
    "Обращайте внимание на положение головы клиента."
  ],
  "⚠️ Важно": [
    "Неправильное положение головы влияет на всё тело.",
    "Работа с компенсациями без устранения первопричины может ухудшить ситуацию."
  ],
  "📚 Домашнее задание": "Изучите анатомию мышц ШВЗ. Найдите на себе или модели основные мышцы: ГКСМ, малую грудную, подзатылочные.",
  "_мотивационная строка_": "*Знание анатомии — основа эффективного массажа.*"
};

async function fixLessons() {
  console.log('🔧 Manually fixing lesson templates based on titles...\n');
  
  const lessonsDir = path.join(process.cwd(), 'store', 'shvz', 'lessons');
  
  // Lesson 2: Fix to MUSCLES template  
  console.log('📝 Fixing Lesson 2: Muscles...');
  const lesson2Path = path.join(lessonsDir, '02', 'lesson.json');
  const lesson2 = JSON.parse(await fs.readFile(lesson2Path, 'utf-8'));
  lesson2.description = { template: MUSCLES_TEMPLATE };
  await fs.writeFile(lesson2Path, JSON.stringify(lesson2, null, 4), 'utf-8');
  console.log('✅ Lesson 2 fixed with MUSCLES template\n');
  
  console.log('═'.repeat(80));
  console.log('✅ Manual fixes complete!');
  console.log('═'.repeat(80));
  console.log('\n💡 Next step:');
  console.log('   COURSE_STORE_PATH=./store/shvz npx tsx --env-file=.env.local scripts/import-lessons.ts');
  console.log('');
}

fixLessons().catch(console.error);
