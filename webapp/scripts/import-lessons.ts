import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

type Json = Record<string, unknown>;

interface LessonFileDescriptor {
  type: string;
  filename: string;
  path: string;
}

interface LessonFile {
  number: number;
  title: string;
  files: LessonFileDescriptor[];
  description?: Json;
}

interface CourseFile {
  name: string;
  description?: string;
  lessons: number[];
}

interface UserProfileRecord {
  user_id?: string;
  name?: string;
  course?: string;
  created_at?: string;
  experience?: string;
  motivation?: string[] | string;
  motivation_other?: string;
  target_clients?: string;
  skills_wanted?: string;
  fears?: string[] | string;
  fears_other?: string;
  wow_result?: string;
  practice_model?: string;
  age?: string;
  massage_experience?: string;
  skill_level?: string;
  goals?: string | string[];
  problems?: string | string[];
  available_time?: string;
  preferences?: unknown;
  [key: string]: unknown;
}

const courseStorePath = path.resolve(
  process.env.COURSE_STORE_PATH ?? "../store/Массаж ШВЗ"
);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "❌ NEXT_PUBLIC_SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY должны быть заданы"
  );
  process.exit(1);
}

console.log("ENV NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log("ENV SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY ? "set" : "missing");

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
  },
});

async function readJson<T>(filePath: string): Promise<T> {
  const content = await fs.readFile(filePath, "utf-8");
  return JSON.parse(content) as T;
}

async function ensureCourse(courseFile: CourseFile) {
  const { data, error } = await supabase
    .from("courses")
    .upsert(
      {
        slug: "massazh-shvz",
        title: courseFile.name,
        description: courseFile.description ?? null,
      },
      { onConflict: "slug", ignoreDuplicates: false }
    )
    .select("id")
    .single();

  if (error) {
    throw new Error(`Не удалось создать курс: ${error.message}`);
  }

  return data.id as string;
}

async function importLessons(courseId: string) {
  const lessonsDir = path.join(courseStorePath, "lessons");
  const lessonDirectories = await fs.readdir(lessonsDir);

  const lessonIdByNumber = new Map<number, string>();

  for (const entry of lessonDirectories) {
    const folderPath = path.join(lessonsDir, entry);
    const stats = await fs.stat(folderPath);
    if (!stats.isDirectory()) continue;

    const lessonJsonPath = path.join(folderPath, "lesson.json");
    const lesson = await readJson<LessonFile>(lessonJsonPath);

    const { data: lessonRow, error } = await supabase
      .from("lessons")
      .upsert(
        {
          course_id: courseId,
          lesson_number: lesson.number,
          title: lesson.title ?? `Урок ${lesson.number}`,
          summary:
            typeof lesson.description === "object"
              ? String(lesson.description?.["summary_short"] ?? "")
              : null,
          content:
            typeof lesson.description === "object" ? lesson.description : null,
        },
        { onConflict: "course_id,lesson_number", ignoreDuplicates: false }
      )
      .select("id")
      .single();

    if (error) {
      throw new Error(`Ошибка импорта урока ${lesson.number}: ${error.message}`);
    }

    const lessonId = lessonRow.id as string;
    lessonIdByNumber.set(lesson.number, lessonId);

    if (lesson.description) {
      const { error: descError } = await supabase
        .from("lesson_descriptions")
        .upsert(
          {
            lesson_id: lessonId,
            data: lesson.description as Json,
          },
          { onConflict: "lesson_id", ignoreDuplicates: false }
        );

      if (descError) {
        throw new Error(
          `Ошибка сохранения описания урока ${lesson.number}: ${descError.message}`
        );
      }
    }

    for (const file of lesson.files ?? []) {
      const metadata = {
        filename: file.filename,
      } satisfies Record<string, unknown>;
      await supabase.from("lesson_assets").upsert(
        {
          lesson_id: lessonId,
          asset_type: file.type,
          url: file.path,
          metadata,
        },
        { ignoreDuplicates: true }
      );
    }
  }

  return lessonIdByNumber;
}

async function importProfiles(
  lessonIdByNumber: Map<number, string>,
  courseSlug: string
) {
  const profilesPath = path.resolve(courseStorePath, "..", "user_profiles.json");
  const rawProfiles = await readJson<Record<string, UserProfileRecord>>(profilesPath);

  for (const [userId, profile] of Object.entries(rawProfiles)) {
    const { data: profileRow, error } = await supabase
      .from("profiles")
      .upsert(
        {
          user_identifier: userId,
          name: profile.name ?? null,
          course_slug: courseSlug,
          survey: profile as Json,
        },
        { onConflict: "user_identifier", ignoreDuplicates: false }
      )
      .select("id")
      .single();

    if (error) {
      console.error(`⚠️ Не удалось сохранить профиль ${userId}: ${error.message}`);
      continue;
    }

    const profileId = profileRow.id as string;

    const personalizeDir = path.join(courseStorePath, "personalize", userId);
    try {
      const files = await fs.readdir(personalizeDir);
      for (const file of files) {
        if (!file.endsWith(".json")) continue;
        const match = file.match(/^(\d+)/);
        if (!match) continue;
        const lessonNumber = Number(match[1]);
        const lessonId = lessonIdByNumber.get(lessonNumber);
        if (!lessonId) continue;

        const personalizedData = await readJson<Json>(
          path.join(personalizeDir, file)
        );

        await supabase
          .from("personalized_lesson_descriptions")
          .upsert(
            {
              profile_id: profileId,
              lesson_id: lessonId,
              content: personalizedData,
            },
            {
              onConflict: "profile_id,lesson_id",
              ignoreDuplicates: false,
            }
          );
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        continue;
      }
      throw error;
    }
  }
}

async function main() {
  console.log("🚀 Импорт курса из", courseStorePath);

  const courseFile = await readJson<CourseFile>(
    path.join(courseStorePath, "course.json")
  );
  const courseId = await ensureCourse(courseFile);
  console.log("✅ Курс", courseFile.name, "ID:", courseId);

  const lessons = await importLessons(courseId);
  console.log("📚 Импортировано уроков:", lessons.size);

  await importProfiles(lessons, "massazh-shvz");
  console.log("👥 Профили и персональные описания импортированы");
}

main().catch((error) => {
  console.error("❌ Ошибка импорта:", error);
  process.exit(1);
});

