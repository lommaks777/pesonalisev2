import { PersonalizedContent } from "./openai";

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
 */
export function formatPersonalizedContent(content: PersonalizedContent | Record<string, unknown>): string {
  const typedContent = content as PersonalizedContent;
  
  const introduction = typedContent.introduction || "";
  const keyPoints = typedContent.key_points || [];
  const practicalTips = typedContent.practical_tips || [];
  const importantNotes = typedContent.important_notes;
  const equipmentPreparation = typedContent.equipment_preparation;
  const homework = typedContent.homework || "";
  const motivationalLine = typedContent.motivational_line || "";

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
