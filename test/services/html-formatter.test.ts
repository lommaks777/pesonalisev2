import { describe, it, expect } from 'vitest';
import { formatDefaultTemplateContent } from '@/lib/services/html-formatter';
import { LessonTemplate } from '@/lib/services/lesson-templates';

describe('formatDefaultTemplateContent', () => {
  it('should format complete template with all sections', () => {
    const template: LessonTemplate = {
      introduction: 'Введение в урок',
      key_points: ['Первый пункт', 'Второй пункт', 'Третий пункт', 'Четвертый пункт'],
      practical_tips: ['Совет 1', 'Совет 2', 'Совет 3'],
      important_notes: ['Важное замечание 1', 'Важное замечание 2'],
      equipment_preparation: 'Подготовьте коврик и полотенце',
      homework: 'Практикуйте 15 минут каждый день',
      motivational_line: 'Вы справитесь!',
    };

    const lessonInfo = {
      lesson_number: 1,
      title: 'Тестовый урок',
    };

    const html = formatDefaultTemplateContent(template, lessonInfo, true);

    // Check that HTML contains all sections
    expect(html).toContain('Введение');
    expect(html).toContain('Ключевые моменты');
    expect(html).toContain('Практические советы');
    expect(html).toContain('Важно');
    expect(html).toContain('Инвентарь и подготовка');
    expect(html).toContain('Домашнее задание');
    
    // Check content is present
    expect(html).toContain('Введение в урок');
    expect(html).toContain('Первый пункт');
    expect(html).toContain('Совет 1');
    expect(html).toContain('Важное замечание 1');
    expect(html).toContain('Подготовьте коврик');
    expect(html).toContain('Практикуйте 15 минут');
    expect(html).toContain('Вы справитесь!');
    
    // Check for default template indicator
    expect(html).toContain('persona-default');
    expect(html).toContain('Базовая версия урока');
  });

  it('should include survey CTA when includeSurveyCTA is true', () => {
    const template: LessonTemplate = {
      introduction: 'Введение',
      key_points: ['Пункт 1', 'Пункт 2', 'Пункт 3', 'Пункт 4'],
      practical_tips: ['Совет 1', 'Совет 2', 'Совет 3'],
      homework: 'Домашнее задание',
      motivational_line: 'Мотивация',
    };

    const lessonInfo = { lesson_number: 1, title: 'Урок 1' };
    const html = formatDefaultTemplateContent(template, lessonInfo, true);

    expect(html).toContain('Заполните анкету');
    expect(html).toContain('/survey/iframe');
  });

  it('should exclude survey CTA when includeSurveyCTA is false', () => {
    const template: LessonTemplate = {
      introduction: 'Введение',
      key_points: ['Пункт 1', 'Пункт 2', 'Пункт 3', 'Пункт 4'],
      practical_tips: ['Совет 1', 'Совет 2', 'Совет 3'],
      homework: 'Домашнее задание',
      motivational_line: 'Мотивация',
    };

    const lessonInfo = { lesson_number: 1, title: 'Урок 1' };
    const html = formatDefaultTemplateContent(template, lessonInfo, false);

    expect(html).not.toContain('Заполните анкету');
    expect(html).not.toContain('persona-default-header');
  });

  it('should handle minimal template with only required fields', () => {
    const template: LessonTemplate = {
      introduction: 'Минимальное введение',
      key_points: ['Пункт 1', 'Пункт 2', 'Пункт 3', 'Пункт 4'],
      practical_tips: ['Совет 1', 'Совет 2', 'Совет 3'],
      homework: 'Домашнее задание',
      motivational_line: 'Мотивация',
    };

    const lessonInfo = { lesson_number: 2, title: 'Урок 2' };
    const html = formatDefaultTemplateContent(template, lessonInfo, false);

    expect(html).toContain('Минимальное введение');
    expect(html).toContain('Пункт 1');
    expect(html).toContain('Совет 1');
    expect(html).toContain('Домашнее задание');
    expect(html).toContain('Мотивация');
    
    // Should not contain optional sections
    expect(html).not.toContain('Важно');
    expect(html).not.toContain('Инвентарь и подготовка');
  });

  it('should escape HTML special characters', () => {
    const template: LessonTemplate = {
      introduction: 'Введение с <script>alert("xss")</script>',
      key_points: ['Пункт с <b>HTML</b>', 'Пункт с & символом', 'Пункт с "кавычками"', 'Пункт 4'],
      practical_tips: ["Совет с 'одинарными'", 'Совет 2', 'Совет 3'],
      homework: 'Задание с > и <',
      motivational_line: 'Мотивация & успех',
    };

    const lessonInfo = { lesson_number: 3, title: 'Урок 3' };
    const html = formatDefaultTemplateContent(template, lessonInfo, false);

    // Check that dangerous characters are escaped
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('&lt;b&gt;');
    expect(html).toContain('&amp;');
    expect(html).toContain('&quot;');
    expect(html).toContain('&#039;');
    expect(html).toContain('&gt;');
    expect(html).toContain('&lt;');
    
    // Should not contain raw HTML
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('<b>');
  });

  it('should handle empty arrays gracefully', () => {
    const template: LessonTemplate = {
      introduction: 'Введение',
      key_points: [],
      practical_tips: [],
      homework: 'Домашнее задание',
      motivational_line: 'Мотивация',
    };

    const lessonInfo = { lesson_number: 4, title: 'Урок 4' };
    const html = formatDefaultTemplateContent(template, lessonInfo, false);

    // Should still produce valid HTML
    expect(html).toContain('persona-block');
    expect(html).toContain('Введение');
    expect(html).toContain('Домашнее задание');
    
    // Should not render sections with empty arrays
    expect(html).not.toContain('Ключевые моменты');
    expect(html).not.toContain('Практические советы');
  });

  it('should render optional sections when present', () => {
    const template: LessonTemplate = {
      introduction: 'Введение',
      key_points: ['Пункт 1', 'Пункт 2', 'Пункт 3', 'Пункт 4'],
      practical_tips: ['Совет 1', 'Совет 2', 'Совет 3'],
      important_notes: ['Важно 1', 'Важно 2'],
      equipment_preparation: 'Оборудование',
      homework: 'Домашнее задание',
      motivational_line: 'Мотивация',
    };

    const lessonInfo = { lesson_number: 5, title: 'Урок 5' };
    const html = formatDefaultTemplateContent(template, lessonInfo, false);

    expect(html).toContain('⚠️ Важно');
    expect(html).toContain('Важно 1');
    expect(html).toContain('Важно 2');
    expect(html).toContain('🧰 Инвентарь и подготовка');
    expect(html).toContain('Оборудование');
  });

  it('should not render optional sections when absent', () => {
    const template: LessonTemplate = {
      introduction: 'Введение',
      key_points: ['Пункт 1', 'Пункт 2', 'Пункт 3', 'Пункт 4'],
      practical_tips: ['Совет 1', 'Совет 2', 'Совет 3'],
      homework: 'Домашнее задание',
      motivational_line: 'Мотивация',
    };

    const lessonInfo = { lesson_number: 6, title: 'Урок 6' };
    const html = formatDefaultTemplateContent(template, lessonInfo, false);

    expect(html).not.toContain('⚠️ Важно');
    expect(html).not.toContain('🧰 Инвентарь и подготовка');
  });
});
