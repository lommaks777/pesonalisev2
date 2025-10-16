import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

// Load .env.local
config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function showUserSurvey(userIdentifier: string) {
  console.log(`\n📋 Ответы на анкету пользователя: ${userIdentifier}\n`);
  console.log("=".repeat(60));

  // Get profile with survey data
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_identifier", userIdentifier)
    .maybeSingle();

  if (error) {
    console.error("❌ Ошибка:", error);
    return;
  }

  if (!profile) {
    console.error("❌ Пользователь не найден");
    return;
  }

  console.log(`\n👤 ПРОФИЛЬ:\n`);
  console.log(`   ID: ${profile.id}`);
  console.log(`   User Identifier: ${profile.user_identifier}`);
  console.log(`   Имя: ${profile.name}`);
  console.log(`   Создан: ${profile.created_at}`);
  console.log(`   Обновлен: ${profile.updated_at}`);

  if (!profile.survey) {
    console.log(`\n⚠️  Анкета не заполнена`);
    return;
  }

  const survey = profile.survey as any;

  console.log(`\n\n📝 ОТВЕТЫ НА АНКЕТУ:\n`);
  console.log("=".repeat(60));

  // Real name
  if (survey.real_name) {
    console.log(`\n✏️  Имя:`);
    console.log(`   ${survey.real_name}`);
  }

  // Course
  if (survey.course) {
    console.log(`\n📚 Курс:`);
    console.log(`   ${survey.course}`);
  }

  // Experience
  if (survey.experience) {
    console.log(`\n🎓 Опыт в массаже:`);
    console.log(`   ${formatExperience(survey.experience)}`);
  }

  // Motivation
  if (survey.motivation) {
    console.log(`\n🎯 Мотивация (зачем изучаете массаж):`);
    if (Array.isArray(survey.motivation)) {
      survey.motivation.forEach((m: string) => {
        console.log(`   • ${formatMotivation(m)}`);
      });
    } else {
      console.log(`   ${formatMotivation(survey.motivation)}`);
    }
  }

  if (survey.motivation_other) {
    console.log(`   Другое: ${survey.motivation_other}`);
  }

  // Target clients
  if (survey.target_clients) {
    console.log(`\n👥 Целевая аудитория клиентов:`);
    console.log(`   ${survey.target_clients}`);
  }

  // Skills wanted
  if (survey.skills_wanted) {
    console.log(`\n🎯 Какие навыки хотите получить:`);
    console.log(`   ${survey.skills_wanted}`);
  }

  // Fears
  if (survey.fears) {
    console.log(`\n😰 Страхи/опасения:`);
    if (Array.isArray(survey.fears)) {
      survey.fears.forEach((f: string) => {
        console.log(`   • ${formatFear(f)}`);
      });
    } else {
      console.log(`   ${formatFear(survey.fears)}`);
    }
  }

  if (survey.fears_other) {
    console.log(`   Другое: ${survey.fears_other}`);
  }

  // WOW Result
  if (survey.wow_result) {
    console.log(`\n🌟 Желаемый WOW-результат:`);
    console.log(`   ${survey.wow_result}`);
  }

  // Practice model
  if (survey.practice_model) {
    console.log(`\n🤝 На ком будете практиковаться:`);
    console.log(`   ${survey.practice_model}`);
  }

  // Additional fields (if exist)
  const additionalFields = [
    'age', 'massage_experience', 'skill_level', 'goals', 
    'problems', 'available_time', 'preferences'
  ];

  const hasAdditionalFields = additionalFields.some(field => survey[field]);

  if (hasAdditionalFields) {
    console.log(`\n\n📊 ДОПОЛНИТЕЛЬНЫЕ ДАННЫЕ:\n`);
    console.log("=".repeat(60));

    additionalFields.forEach(field => {
      if (survey[field]) {
        console.log(`\n${formatFieldName(field)}:`);
        console.log(`   ${survey[field]}`);
      }
    });
  }

  console.log(`\n\n${"=".repeat(60)}\n`);
}

function formatExperience(exp: string): string {
  const map: Record<string, string> = {
    'beginner': 'Начинающий (нет опыта)',
    'self_taught': 'Самоучка (занимался самостоятельно)',
    'intermediate': 'Средний уровень',
    'advanced': 'Продвинутый',
    'professional': 'Профессионал'
  };
  return map[exp] || exp;
}

function formatMotivation(mot: string): string {
  const map: Record<string, string> = {
    'new_profession': 'Новая профессия',
    'extra_income': 'Дополнительный доход',
    'help_family': 'Помощь семье',
    'help_others': 'Помощь другим',
    'health_improvement': 'Улучшение здоровья',
    'self_development': 'Саморазвитие',
    'hobby': 'Хобби'
  };
  return map[mot] || mot;
}

function formatFear(fear: string): string {
  const map: Record<string, string> = {
    'technique_fail': 'Не получится техника',
    'no_clients': 'Не смогу найти клиентов',
    'hurt_someone': 'Навредить кому-то',
    'no_time': 'Не хватит времени',
    'too_difficult': 'Слишком сложно',
    'no_confidence': 'Не уверен в себе'
  };
  return map[fear] || fear;
}

function formatFieldName(field: string): string {
  const map: Record<string, string> = {
    'age': '👤 Возраст',
    'massage_experience': '💆 Опыт массажа',
    'skill_level': '📊 Уровень навыков',
    'goals': '🎯 Цели',
    'problems': '❗ Проблемы',
    'available_time': '⏰ Доступное время',
    'preferences': '⭐ Предпочтения'
  };
  return map[field] || field;
}

const userIdentifier = process.argv[2] || "21179358";
showUserSurvey(userIdentifier).catch(console.error);
