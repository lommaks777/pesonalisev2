/**
 * @fileoverview Legacy lesson template loading functionality
 * 
 * @deprecated This module is deprecated in favor of the new personalization-engine.ts
 * which generates personalized content directly from lesson transcripts stored in the database.
 * 
 * Migration path:
 * - Instead of loadLessonTemplate() → use loadLessonTranscript() from personalization-engine.ts
 * - Instead of personalizeLesson(template) → use generatePersonalizedDescription(transcript)
 * 
 * This file is kept for backward compatibility only.
 */

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

// New 7-section template structure
export interface LessonTemplate {
  introduction?: string; // 2-3 sentences: lesson goal and expected result
  key_points?: string[]; // 4-6 bullet points, each ≤18 words
  practical_tips?: string[]; // 3-5 instruction points with imperative verbs
  important_notes?: string[]; // 2-4 points about contraindications (conditional)
  equipment_preparation?: string; // Equipment list and setup (conditional)
  homework?: string; // 1-2 sentences with concrete action
  motivational_line?: string; // 1 inspirational sentence
  [key: string]: any;
}

// Legacy 5-field template structure (for backward compatibility)
export interface LegacyLessonTemplate {
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
 * Automatically detects and transforms old format to new format
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
        
        // Validate it's an object
        if (!template || typeof template !== "object") {
          console.error(`Invalid template structure in ${filename}`);
          continue;
        }
        
        // Detect format and transform if needed
        const format = detectTemplateFormat(template);
        
        if (format === 'new') {
          // Already in new format, return as-is
          return template as LessonTemplate;
        } else if (format === 'emoji') {
          // Transform emoji-key format to new format
          return transformEmojiToNew(template);
        } else if (format === 'old') {
          // Transform old format to new
          console.log(`Transforming old format template for lesson ${lessonNumber}`);
          return transformOldToNew(template as LegacyLessonTemplate);
        } else {
          console.warn(`Unknown template format for lesson ${lessonNumber}, using as-is`);
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
    introduction: `Урок ${lessonNumber}: введение в технику массажа`,
    key_points: [
      "Узнаете основные техники работы",
      "Научитесь правильному позиционированию",
      "Поймёте критерии эффективности",
      "Освоите безопасные приёмы работы"
    ],
    practical_tips: [
      "Следите за реакцией клиента",
      "Начинайте с лёгкого давления",
      "Избегайте болезненных ощущений"
    ],
    homework: "Просмотрите видео урока и попрактикуйтесь 10-15 минут",
    motivational_line: "Каждая практика приближает вас к мастерству"
  };
}

/**
 * Detects whether template uses old (5-field), new (7-section), or emoji-key format
 */
export function detectTemplateFormat(template: any): 'old' | 'new' | 'emoji' | 'unknown' {
  if (!template || typeof template !== 'object') {
    return 'unknown';
  }
  
  // Check for emoji-key format
  if (template['👋 Введение'] !== undefined || 
      template['🔑 Ключевые моменты'] !== undefined ||
      template['_мотивационная строка_'] !== undefined) {
    return 'emoji';
  }
  
  // Check for new format fields
  if (template.introduction !== undefined || 
      template.key_points !== undefined || 
      template.practical_tips !== undefined) {
    return 'new';
  }
  
  // Check for old format fields
  if (template.summary_short !== undefined || 
      template.why_watch !== undefined || 
      template.homework_20m !== undefined) {
    return 'old';
  }
  
  return 'unknown';
}

/**
 * Transforms old 5-field template to new 7-section structure
 */
export function transformOldToNew(oldTemplate: LegacyLessonTemplate): LessonTemplate {
  const introduction = oldTemplate.summary_short || "";
  
  // Try to extract bullet points from why_watch, or create single-item array
  let keyPoints: string[] = [];
  if (oldTemplate.why_watch) {
    // Split by line breaks or bullet markers
    const lines = oldTemplate.why_watch.split(/[\n\r]+/).filter(line => line.trim());
    keyPoints = lines.length > 0 ? lines : [oldTemplate.why_watch];
  }
  
  // Convert quick_action to imperative instruction format
  const practicalTips: string[] = oldTemplate.quick_action 
    ? [oldTemplate.quick_action]
    : [];
  
  const homework = oldTemplate.homework_20m || "";
  
  // Generate generic motivational line
  const motivationalLine = "Регулярная практика приведёт вас к мастерству";
  
  return {
    introduction,
    key_points: keyPoints,
    practical_tips: practicalTips,
    homework,
    motivational_line: motivationalLine
  };
}

/**
 * Transforms emoji-key format to standard new format
 */
export function transformEmojiToNew(emojiTemplate: any): LessonTemplate {
  return {
    introduction: emojiTemplate['👋 Введение'] || '',
    key_points: emojiTemplate['🔑 Ключевые моменты'] || [],
    practical_tips: emojiTemplate['💡 Практические советы'] || [],
    important_notes: emojiTemplate['⚠️ Важно'],
    equipment_preparation: emojiTemplate['🧰 Инвентарь и подготовка'],
    homework: emojiTemplate['📚 Домашнее задание'] || '',
    motivational_line: emojiTemplate['_мотивационная строка_'] || ''
  };
}

/**
 * Validates that template has required fields for new format
 */
export function validateNewTemplate(template: LessonTemplate): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!template.introduction) {
    errors.push("Missing required field: introduction");
  }
  
  if (!template.key_points || !Array.isArray(template.key_points) || template.key_points.length === 0) {
    errors.push("Missing or empty required field: key_points (must be array with 4-6 items)");
  } else if (template.key_points.length < 4 || template.key_points.length > 6) {
    errors.push(`key_points should have 4-6 items, got ${template.key_points.length}`);
  }
  
  if (!template.practical_tips || !Array.isArray(template.practical_tips) || template.practical_tips.length === 0) {
    errors.push("Missing or empty required field: practical_tips (must be array with 3-5 items)");
  } else if (template.practical_tips.length < 3 || template.practical_tips.length > 5) {
    errors.push(`practical_tips should have 3-5 items, got ${template.practical_tips.length}`);
  }
  
  if (!template.homework) {
    errors.push("Missing required field: homework");
  }
  
  if (!template.motivational_line) {
    errors.push("Missing required field: motivational_line");
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
