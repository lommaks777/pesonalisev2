import { PersonalizedContent } from "./openai";
import { LessonTemplate } from "./lesson-templates";

/**
 * Escapes HTML special characters to prevent XSS
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * Generates persona-block HTML from personalized content (new 7-section format)
 * Automatically detects and converts old 5-field format to new format
 * Also supports alternative personalization formats
 */
export function formatPersonalizedContent(content: PersonalizedContent | Record<string, unknown>): string {
  const typedContent = content as PersonalizedContent;
  
  // Detect format: old (5-field), new (7-section), alternative, or emoji-keys
  const isOldFormat = 'summary_short' in content || 'why_watch' in content || 'homework_20m' in content;
  const isAlternativeFormat = 'key_takeaways' in content || 'addressing_fears' in content || 'why_it_matters_for_you' in content;
  
  let introduction: string;
  let keyPoints: string[];
  let practicalTips: string[];
  let importantNotes: string[] | undefined;
  let equipmentPreparation: string | undefined;
  let homework: string;
  let motivationalLine: string;
  
  if (isOldFormat) {
    // Convert old format (5 fields) to new format
    const oldContent = content as any;
    introduction = oldContent.summary_short || "";
    
    // Convert why_watch to key_points
    keyPoints = oldContent.why_watch 
      ? oldContent.why_watch.split(/[\n\r]+/).filter((line: string) => line.trim()).slice(0, 6)
      : [];
    
    // Convert quick_action to practical_tips
    practicalTips = oldContent.quick_action 
      ? [oldContent.quick_action]
      : [];
    
    homework = oldContent.homework_20m || "";
    motivationalLine = oldContent.social_share || "";
    importantNotes = undefined;
    equipmentPreparation = oldContent.prev_lessons;
  } else if (isAlternativeFormat) {
    // Convert alternative format (from old personalization-engine.ts)
    const altContent = content as any;
    introduction = altContent.introduction || "";
    keyPoints = altContent.key_takeaways || [];
    
    // Combine practical_application and addressing_fears into practical_tips
    practicalTips = [];
    if (altContent.practical_application) {
      practicalTips.push(altContent.practical_application);
    }
    if (altContent.addressing_fears) {
      practicalTips.push(altContent.addressing_fears);
    }
    
    homework = altContent.personalized_homework || "";
    motivationalLine = altContent.motivational_quote || altContent.why_it_matters_for_you || "";
    importantNotes = undefined;
    equipmentPreparation = undefined;
  } else {
    // Use new format directly (7 sections)
    introduction = typedContent.introduction || "";
    keyPoints = typedContent.key_points || [];
    practicalTips = typedContent.practical_tips || [];
    importantNotes = typedContent.important_notes;
    equipmentPreparation = typedContent.equipment_preparation;
    homework = typedContent.homework || "";
    motivationalLine = typedContent.motivational_line || "";
  }

  return `
    <div class="persona-block">
      ${introduction ? `
        <div class="persona-section persona-intro">
          <h3 class="persona-section-title">👋 Введение</h3>
          <p class="persona-text">${escapeHtml(introduction)}</p>
        </div>
      ` : ''}

      ${keyPoints.length > 0 ? `
        <div class="persona-section">
          <h3 class="persona-section-title">🔑 Ключевые моменты</h3>
          <ul class="persona-list persona-key-points">
            ${keyPoints.map(point => `<li class="persona-list-item">${escapeHtml(point)}</li>`).join('')}
          </ul>
        </div>
      ` : ''}

      ${practicalTips.length > 0 ? `
        <div class="persona-section">
          <h3 class="persona-section-title">💡 Практические советы</h3>
          <ul class="persona-list persona-tips">
            ${practicalTips.map(tip => `<li class="persona-list-item">${escapeHtml(tip)}</li>`).join('')}
          </ul>
        </div>
      ` : ''}

      ${importantNotes && importantNotes.length > 0 ? `
        <div class="persona-section persona-warning">
          <h3 class="persona-section-title">⚠️ Важно</h3>
          <ul class="persona-list">
            ${importantNotes.map(note => `<li class="persona-list-item">${escapeHtml(note)}</li>`).join('')}
          </ul>
        </div>
      ` : ''}

      ${equipmentPreparation ? `
        <div class="persona-section persona-equipment">
          <h3 class="persona-section-title">🧰 Инвентарь и подготовка</h3>
          <p class="persona-text">${escapeHtml(equipmentPreparation)}</p>
        </div>
      ` : ''}

      ${homework ? `
        <div class="persona-section persona-homework">
          <h3 class="persona-section-title">📚 Домашнее задание</h3>
          <p class="persona-text">${escapeHtml(homework)}</p>
        </div>
      ` : ''}

      ${motivationalLine ? `
        <div class="persona-section persona-motivation">
          <p class="persona-text"><em>${escapeHtml(motivationalLine)}</em></p>
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * Generates "fill survey" prompt HTML
 */
export function formatSurveyAlert(userId: string): string {
  return `
    <div class="persona-block">
      <div class="persona-alert">
        <h3>💡 Персонализация недоступна</h3>
        <p>Заполните анкету, чтобы получить персональные рекомендации для этого урока.</p>
        <a href="/survey/iframe?uid=${userId}" class="persona-btn" target="_blank">
          Заполнить анкету →
        </a>
      </div>
    </div>
  `;
}

/**
 * Generates generic alert box HTML
 */
export function formatNotFoundAlert(message: string, type: "warning" | "info" = "warning"): string {
  const className = type === "warning" ? "persona-alert persona-warning" : "persona-alert";
  
  return `
    <div class="persona-block">
      <div class="${className}">
        <p>${message}</p>
      </div>
    </div>
  `;
}

/**
 * Generates personalization unavailable alert
 */
export function formatPersonalizationUnavailableAlert(userId: string): string {
  return `
    <div class="persona-block">
      <div class="persona-alert">
        <h3>📝 Персонализация недоступна</h3>
        <p>Для этого урока еще не создано персональное описание. Пожалуйста, заполните анкету, чтобы получить персонализированные рекомендации.</p>
        <a href="/survey/iframe?uid=${userId}" class="persona-btn" target="_blank">
          Заполнить анкету →
        </a>
      </div>
    </div>
  `;
}

/**
 * Formats default lesson template as HTML
 * Used when user profile is not found or personalization doesn't exist yet
 * Supports both new format (default_description with what_you_will_learn, key_techniques)
 * and old format (lesson templates with key_points, practical_tips)
 */
export function formatDefaultTemplateContent(
  template: LessonTemplate | Record<string, any>,
  lessonInfo: { lesson_number: number; title: string },
  includeSurveyCTA: boolean = true
): string {
  // Detect format:
  // 1. New default_description format (from generate-default-descriptions.ts)
  // 2. Old template format (from lesson templates)
  // 3. Old emoji format (from migration 002)
  const isDefaultDescription = 'what_you_will_learn' in template || 'key_techniques' in template;
  const isOldEmojiFormat = '👋 Введение' in template || '🔑 Ключевые моменты' in template;
  
  let introduction: string;
  let keyPoints: string[];
  let practicalTips: string[];
  let importantNotes: string[] | undefined;
  let equipmentPreparation: string | undefined;
  let homework: string;
  let motivationalLine: string;
  
  if (isDefaultDescription) {
    // New default_description format
    const desc = template as any;
    introduction = desc.introduction || "";
    keyPoints = Array.isArray(desc.what_you_will_learn) ? desc.what_you_will_learn : [];
    practicalTips = Array.isArray(desc.key_techniques) ? desc.key_techniques : [];
    importantNotes = undefined; // not in new format
    equipmentPreparation = desc.equipment_needed;
    homework = desc.homework || "";
    motivationalLine = desc.motivational_note || "";
  } else if (isOldEmojiFormat) {
    // Old format with emoji keys (from migration 002)
    const oldTemplate = template as any;
    introduction = oldTemplate['👋 Введение'] || oldTemplate['👋 Introduction'] || "";
    keyPoints = oldTemplate['🔑 Ключевые моменты'] || oldTemplate['🔑 Key Points'] || [];
    practicalTips = oldTemplate['💡 Практические советы'] || oldTemplate['💡 Practical Tips'] || [];
    importantNotes = oldTemplate['⚠️ Важные замечания'] || oldTemplate['⚠️ Important Notes'];
    equipmentPreparation = oldTemplate['🧰 Инвентарь и подготовка'] || oldTemplate['🧰 Equipment & Preparation'];
    homework = oldTemplate['📚 Домашнее задание'] || oldTemplate['📚 Homework'] || "";
    motivationalLine = oldTemplate['_мотивационная строка_'] || oldTemplate['_motivational line_'] || "";
  } else {
    // Old template format with English keys
    const newTemplate = template as LessonTemplate;
    introduction = newTemplate.introduction || "";
    keyPoints = newTemplate.key_points || [];
    practicalTips = newTemplate.practical_tips || [];
    importantNotes = newTemplate.important_notes;
    equipmentPreparation = newTemplate.equipment_preparation;
    homework = newTemplate.homework || "";
    motivationalLine = newTemplate.motivational_line || "";
  }

  return `
    <div class="persona-block persona-default">
      ${includeSurveyCTA ? `
        <div class="persona-section persona-default-header">
          <p class="persona-text-muted">Заполните анкету в первом уроке, чтобы получить персонализированные рекомендации специально для вас.</p>
        </div>
      ` : ''}

      ${introduction ? `
        <div class="persona-section persona-intro">
          <h3 class="persona-section-title">👋 Введение</h3>
          <p class="persona-text">${escapeHtml(introduction)}</p>
        </div>
      ` : ''}

      ${keyPoints.length > 0 ? `
        <div class="persona-section">
          <h3 class="persona-section-title">🎯 Что вы узнаете</h3>
          <ul class="persona-list persona-key-points">
            ${keyPoints.map(point => `<li class="persona-list-item">${escapeHtml(point)}</li>`).join('')}
          </ul>
        </div>
      ` : ''}

      ${practicalTips.length > 0 ? `
        <div class="persona-section">
          <h3 class="persona-section-title">🔑 Ключевые техники</h3>
          <ul class="persona-list persona-tips">
            ${practicalTips.map(tip => `<li class="persona-list-item">${escapeHtml(tip)}</li>`).join('')}
          </ul>
        </div>
      ` : ''}

      ${importantNotes && importantNotes.length > 0 ? `
        <div class="persona-section persona-warning">
          <h3 class="persona-section-title">⚠️ Важно</h3>
          <ul class="persona-list">
            ${importantNotes.map(note => `<li class="persona-list-item">${escapeHtml(note)}</li>`).join('')}
          </ul>
        </div>
      ` : ''}

      ${equipmentPreparation ? `
        <div class="persona-section persona-equipment">
          <h3 class="persona-section-title">🧰 Инвентарь и подготовка</h3>
          <p class="persona-text">${escapeHtml(equipmentPreparation)}</p>
        </div>
      ` : ''}

      ${homework ? `
        <div class="persona-section persona-homework">
          <h3 class="persona-section-title">📚 Домашнее задание</h3>
          <p class="persona-text">${escapeHtml(homework)}</p>
        </div>
      ` : ''}

      ${motivationalLine ? `
        <div class="persona-section persona-motivation">
          <p class="persona-text"><em>${escapeHtml(motivationalLine)}</em></p>
        </div>
      ` : ''}
    </div>
  `;
}
