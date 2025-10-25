import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Переменные окружения Supabase не найдены');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProgress() {
  try {
    // Получаем курс
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, title, slug')
      .eq('slug', 'taping-basics')
      .single();
    
    if (courseError || !course) {
      console.log('❌ Ошибка получения курса:', courseError?.message);
      return;
    }
    
    console.log('📚 Курс:', course.title);
    console.log('🔗 Slug:', course.slug);
    console.log('');
    
    // Получаем уроки с транскриптами
    const { data: lessons, count, error: lessonsError } = await supabase
      .from('lessons')
      .select('lesson_number, title, content', { count: 'exact' })
      .eq('course_id', course.id)
      .order('lesson_number');
    
    if (lessonsError) {
      console.log('❌ Ошибка получения уроков:', lessonsError.message);
      return;
    }
    
    console.log('📊 Общая статистика:');
    console.log('  Всего уроков в базе:', count);
    
    const withTranscripts = lessons?.filter(l => l.content?.transcript).length || 0;
    console.log('  С транскриптами:', withTranscripts);
    console.log('  Без транскриптов:', (count || 0) - withTranscripts);
    const percent = count ? Math.round(withTranscripts / count * 100) : 0;
    console.log('  Прогресс:', withTranscripts + '/' + count + ' (' + percent + '%)');
    console.log('');
    
    if (lessons && lessons.length > 0) {
      console.log('📝 Детали по урокам:');
      lessons.forEach(lesson => {
        const hasTranscript = lesson.content?.transcript ? '✅' : '❌';
        const transcriptLength = lesson.content?.transcript?.length || 0;
        const title = lesson.title.length > 45 ? lesson.title.substring(0, 45) + '...' : lesson.title;
        const lessonNum = String(lesson.lesson_number).padStart(2, '0');
        console.log('  ' + hasTranscript + ' Урок ' + lessonNum + ': ' + title + ' (' + transcriptLength + ' симв.)');
      });
    }
    
    console.log('');
    console.log('⏱️  Время проверки:', new Date().toLocaleTimeString('ru-RU'));
    
  } catch (error: any) {
    console.error('❌ Критическая ошибка:', error?.message || error);
  }
}

checkProgress().catch(console.error);
