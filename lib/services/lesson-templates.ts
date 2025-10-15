import fs from "fs";
import path from "path";

// Single source of truth for lesson ID mappings
const LESSON_ID_MAP: Record<number, string> = {
  1: "c8a90762-6fca-47a8-80c3-5f454ae05273",
  2: "26ef3e23-3d2e-4461-80bf-622f26737528",
  3: "56766339-03e0-4c1b-9d99-cc49590ad3fd",
  4: "8227a790-17ef-489a-8538-afbe2c4c10ce",
  5: "f9b62dc5-9b76-491d-8b9b-2b72411df740",
  6: "1c75e3db-9afd-4237-8b8f-16be2b00ae0c",
  7: "387be494-dcf4-41a0-83c2-380fdd4f4cc1",
  8: "61b19549-d1bf-4265-bb1e-ff21ae7891a0",
  9: "e0f961c1-b8e3-4f57-939d-fb188d2703a9",
  10: "913d5be1-bbfb-4d32-b4d2-157d10551389",
  11: "69b9560e-2af2-4690-af44-1398ace0f75e",
  12: "722e1278-2dcf-4e76-baa3-8d674f3abda4",
};

const TEMPLATE_DIR = path.join(process.cwd(), "store", "shvz");

export interface LessonTemplate {
  summary_short?: string;
  why_watch?: string;
  quick_action?: string;
  social_share?: string;
  homework_20m?: string;
  prev_lessons?: string;
  [key: string]: any;
}

/**
 * Returns UUID for lesson number
 */
export function getLessonTemplateId(lessonNumber: number): string {
  return LESSON_ID_MAP[lessonNumber] || "";
}

/**
 * Returns all lesson ID mappings
 */
export function getLessonTemplateIds(): Record<number, string> {
  return { ...LESSON_ID_MAP };
}

/**
 * Loads and parses lesson template JSON
 * Returns default template structure if file not found
 */
export async function loadLessonTemplate(
  lessonNumber: number
): Promise<LessonTemplate> {
  const id = getLessonTemplateId(lessonNumber);
  
  if (!id) {
    console.warn(`No template ID found for lesson ${lessonNumber}`);
    return getDefaultTemplate(lessonNumber);
  }

  // Try multiple filename patterns
  const candidates = [
    `${lessonNumber}-${lessonNumber}-${id}-final.json`,
    `${lessonNumber}-${id}-final.json`,
    `${id}-final.json`,
  ];

  for (const filename of candidates) {
    const templatePath = path.join(TEMPLATE_DIR, filename);
    
    if (fs.existsSync(templatePath)) {
      try {
        const content = fs.readFileSync(templatePath, "utf8");
        const template = JSON.parse(content);
        
        // Validate required fields exist
        if (template && typeof template === "object") {
          return template;
        }
      } catch (error) {
        console.error(`Error parsing template file ${filename}:`, error);
      }
    }
  }

  // Return default template if none found
  console.warn(`No template file found for lesson ${lessonNumber}`);
  return getDefaultTemplate(lessonNumber);
}

/**
 * Returns default template structure
 */
function getDefaultTemplate(lessonNumber: number): LessonTemplate {
  return {
    summary_short: `Урок ${lessonNumber}`,
    why_watch: "Этот урок поможет вам освоить важные техники массажа",
    quick_action: "Просмотрите видео урока внимательно",
    social_share: "Изучаю новые техники массажа!",
    homework_20m: "Просмотрите видео урока и попрактикуйтесь 10-15 минут",
  };
}
