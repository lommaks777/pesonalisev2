import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLessonContent() {
  // Get taping-basics course
  const { data: course } = await supabase
    .from('courses')
    .select('id, title, slug')
    .eq('slug', 'taping-basics')
    .single();

  if (!course) {
    console.log('Course not found');
    return;
  }

  console.log(`Course: ${(course as any).title} (${(course as any).id})\n`);

  // Get lesson 1
  const { data: lesson } = await supabase
    .from('lessons')
    .select('*')
    .eq('course_id', (course as any).id)
    .eq('lesson_number', 1)
    .single();

  if (!lesson) {
    console.log('Lesson 1 not found');
    return;
  }

  const lessonTyped = lesson as any;
  console.log(`Lesson: ${lessonTyped.title}`);
  console.log(`Lesson ID: ${lessonTyped.id}`);
  console.log(`\nContent structure:`);
  console.log(`- content exists: ${!!lessonTyped.content}`);
  
  if (lessonTyped.content) {
    console.log(`- content.template exists: ${!!lessonTyped.content.template}`);
    console.log(`- content.transcription exists: ${!!lessonTyped.content.transcription}`);
    
    if (lessonTyped.content.template) {
      console.log(`\nTemplate keys:`, Object.keys(lessonTyped.content.template));
      console.log(`\nTemplate content (first 200 chars):`);
      console.log(JSON.stringify(lessonTyped.content.template, null, 2).substring(0, 200));
    }
  }
}

checkLessonContent()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
