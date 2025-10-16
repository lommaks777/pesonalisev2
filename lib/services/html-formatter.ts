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
 */
export function formatPersonalizedContent(content: PersonalizedContent | Record<string, unknown>): string {
  const typedContent = content as PersonalizedContent;
  
  // Detect if this is old format (has summary_short, why_watch, etc.)
  const isOldFormat = 'summary_short' in content || 'why_watch' in content || 'homework_20m' in content;
  
  let introduction: string;
  let keyPoints: string[];
  let practicalTips: string[];
  let importantNotes: string[] | undefined;
  let equipmentPreparation: string | undefined;
  let homework: string;
  let motivationalLine: string;
  
  if (isOldFormat) {
    // Convert old format to new format
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
  } else {
    // Use new format directly
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
 */
export function formatDefaultTemplateContent(
  template: LessonTemplate,
  lessonInfo: { lesson_number: number; title: string },
  includeSurveyCTA: boolean = true
): string {
  const introduction = template.introduction || "";
  const keyPoints = template.key_points || [];
  const practicalTips = template.practical_tips || [];
  const importantNotes = template.important_notes;
  const equipmentPreparation = template.equipment_preparation;
  const homework = template.homework || "";
  const motivationalLine = template.motivational_line || "";

  return `
    <div class="persona-block persona-default">
      ${includeSurveyCTA ? `
        <div class="persona-section persona-default-header">
          <div class="persona-badge">📘 Базовая версия урока</div>
          <p class="persona-text-muted">Заполните анкету, чтобы получить персонализированные рекомендации специально для вас.</p>
          <a href="https://shkolamasterov.online/pl/teach/control/lesson/view?id=342828951" class="persona-btn-secondary" target="_blank">
            Заполнить анкету
          </a>
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
