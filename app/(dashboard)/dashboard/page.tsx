import { Suspense } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ProfileSelector } from "@/components/profiles/profile-selector";
import { PersonalizedLesson } from "@/components/personalizations/personalized-lesson";
import { getLessons } from "@/lib/api/lessons";
import { getProfiles } from "@/lib/api/profiles";
import { getPersonalizationsByProfile } from "@/lib/api/personalizations";

interface DashboardPageProps {
  searchParams: Promise<{ profileId?: string }>;
}

async function LessonsList({ profileId }: { profileId?: string }) {
  const [lessons, profiles] = await Promise.all([getLessons(), getProfiles()]);

  const personalizations = profileId
    ? await getPersonalizationsByProfile(profileId)
    : [];

  const personalizationsByLesson = new Map(
    personalizations.map((item) => [item.lesson_id, item.content])
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      <aside className="border rounded-lg p-4">
        <h2 className="text-sm font-semibold mb-3">Анкеты пользователей</h2>
        <ScrollArea className="h-[320px]">
          {profiles.length > 0 ? (
            <ProfileSelector profiles={profiles} />
          ) : (
            <p className="text-sm text-muted-foreground">
              Анкеты пока не добавлены.
            </p>
          )}
        </ScrollArea>
      </aside>
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Уроки курса</h1>
          <p className="text-sm text-muted-foreground">
            Основные серверные описания и персонализация (если выбран профиль).
          </p>
        </div>
        <Separator />
        <div className="grid gap-4">
          {lessons.map((lesson) => {
            const personalizedData = personalizationsByLesson.get(lesson.id);
            return (
              <article
                key={lesson.id}
                className="rounded-lg border p-4 space-y-4 bg-card"
              >
                <header className="space-y-1">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">
                    Урок {lesson.lesson_number}
                  </div>
                  <h3 className="text-lg font-semibold">{lesson.title}</h3>
                </header>
                {lesson.summary && (
                  <p className="text-sm text-muted-foreground">{lesson.summary}</p>
                )}
                {lesson.lesson_descriptions?.data && (
                  <section className="space-y-2">
                    <h4 className="text-sm font-semibold">Базовое описание</h4>
                    <pre className="text-xs bg-muted/40 rounded p-3 overflow-x-auto">
                      {JSON.stringify(lesson.lesson_descriptions.data as Record<string, unknown>, null, 2)}
                    </pre>
                  </section>
                )}
                {personalizedData ? (
                  <section className="space-y-2">
                    <h4 className="text-sm font-semibold">Персонализация</h4>
                    <PersonalizedLesson
                      lessonNumber={lesson.lesson_number}
                      title={lesson.title}
                      data={personalizedData as Record<string, unknown>}
                    />
                  </section>
                ) : profileId ? (
                  <p className="text-xs text-muted-foreground">
                    Для выбранного профиля нет персонализации этого урока.
                  </p>
                ) : null}
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const profileId = params?.profileId;

  return (
    <Suspense fallback={<div>Загрузка уроков…</div>}>
      <LessonsList profileId={profileId} />
    </Suspense>
  );
}
