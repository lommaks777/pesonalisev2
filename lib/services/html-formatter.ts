import { PersonalizedContent } from "./openai";

/**
 * Generates persona-block HTML from personalized content
 */
export function formatPersonalizedContent(content: PersonalizedContent | Record<string, unknown>): string {
  const summaryShort = (content as any).summary_short || "";
  const prevLessons = (content as any).prev_lessons || "";
  const whyWatch = (content as any).why_watch || "";
  const quickAction = (content as any).quick_action || "";
  const homework20m = (content as any).homework_20m || "";
  const socialShare = (content as any).social_share || "";

  return `
    <div class="persona-block">
      ${summaryShort ? `
        <div class="persona-section">
          <h3 class="persona-section-title">📝 О уроке</h3>
          <p class="persona-text">${summaryShort}</p>
        </div>
      ` : ''}

      ${prevLessons ? `
        <div class="persona-section">
          <h3 class="persona-section-title">📚 Что мы изучили</h3>
          <p class="persona-text">${prevLessons}</p>
        </div>
      ` : ''}

      ${whyWatch ? `
        <div class="persona-section">
          <h3 class="persona-section-title">🎯 Зачем смотреть</h3>
          <p class="persona-text">${whyWatch}</p>
        </div>
      ` : ''}

      ${quickAction ? `
        <div class="persona-section">
          <h3 class="persona-section-title">⚡ Быстрое действие</h3>
          <p class="persona-text">${quickAction}</p>
        </div>
      ` : ''}

      ${homework20m ? `
        <div class="persona-section persona-homework">
          <h3 class="persona-section-title">📚 Домашнее задание (20 мин)</h3>
          <p class="persona-text">${homework20m}</p>
        </div>
      ` : ''}

      ${socialShare ? `
        <div class="persona-section persona-social">
          <h3 class="persona-section-title">📱 Поделиться</h3>
          <p class="persona-text">${socialShare}</p>
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
