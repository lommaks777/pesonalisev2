import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ProfileSurvey } from "@/components/profiles/profile-survey";
import { PersonalizationEditor } from "@/components/personalizations/personalization-editor";

interface ProfilePageProps {
  params: Promise<{ profileId: string }>;
}

async function ProfileContent({ profileId }: { profileId: string }) {
  const supabase = createSupabaseServerClient();

  // Получаем профиль
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", profileId)
    .single();

  if (profileError || !profile) {
    redirect("/dashboard");
  }

  // Получаем все уроки
  const { data: lessons } = await supabase
    .from("lessons")
    .select("*")
    .order("lesson_number");

  // Получаем персонализации для этого профиля
  const { data: personalizations } = await supabase
    .from("personalized_lesson_descriptions")
    .select("*")
    .eq("profile_id", profileId);

  const personalizationsByLesson = new Map(
    (personalizations || []).map((p) => [p.lesson_id, p.content])
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Профиль: {profile.name || "Без имени"}</h1>
        <p className="text-muted-foreground">
          ID: {profile.user_identifier} • Курс: {profile.course_slug || "—"}
        </p>
      </div>

      <ProfileSurvey 
        survey={profile.survey as Record<string, unknown> | null} 
        profileName={profile.name}
      />

      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Персонализированные описания уроков</h2>
        <p className="text-sm text-muted-foreground">
          Создайте или отредактируйте персонализированные описания для каждого урока.
        </p>

        <div className="space-y-6">
          {(lessons || []).map((lesson) => (
            <PersonalizationEditor
              key={lesson.id}
              profileId={profileId}
              lessonId={lesson.id}
              lessonTitle={`Урок ${lesson.lesson_number}: ${lesson.title}`}
              initialContent={
                personalizationsByLesson.get(lesson.id) as Record<string, unknown> | undefined
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { profileId } = await params;

  return (
    <Suspense fallback={<div>Загрузка профиля...</div>}>
      <ProfileContent profileId={profileId} />
    </Suspense>
  );
}



