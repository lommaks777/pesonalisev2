import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from '@/app/api/survey/route';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
          order: vi.fn(),
          maybeSingle: vi.fn(),
        })),
      })),
    })),
  })),
}));

vi.mock('@/lib/services/profile', () => ({
  upsertProfile: vi.fn(),
}));

vi.mock('@/lib/services/openai', () => ({
  personalizeLesson: vi.fn(),
}));

vi.mock('@/lib/services/lesson-templates', () => ({
  loadLessonTemplate: vi.fn(),
}));

vi.mock('@/lib/services/personalization', () => ({
  savePersonalization: vi.fn(),
  getPersonalization: vi.fn(),
}));

describe('POST /api/survey - First Lesson Preview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return first lesson preview in response', async () => {
    const { createSupabaseServerClient } = await import('@/lib/supabase/server');
    const { upsertProfile } = await import('@/lib/services/profile');
    const { personalizeLesson } = await import('@/lib/services/openai');
    const { loadLessonTemplate } = await import('@/lib/services/lesson-templates');
    const { getPersonalization } = await import('@/lib/services/personalization');
    
    const mockSupabase = createSupabaseServerClient();
    
    // Mock course lookup
    vi.mocked(mockSupabase.from).mockImplementation((table: string) => {
      if (table === 'courses') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: { id: 'course-1' }
              }),
            })),
          })),
        } as any;
      } else if (table === 'lessons') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn().mockResolvedValue({
                data: [
                  { id: 'lesson-1', lesson_number: 1, title: 'Урок 1', summary: 'Первый урок' },
                  { id: 'lesson-2', lesson_number: 2, title: 'Урок 2', summary: 'Второй урок' },
                ],
                error: null,
              }),
            })),
          })),
        } as any;
      }
      return {} as any;
    });

    vi.mocked(upsertProfile).mockResolvedValue({
      id: 'profile-1',
      user_identifier: 'test_user',
      name: 'Тест Пользователь',
      course_slug: 'shvz',
      survey: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    vi.mocked(loadLessonTemplate).mockResolvedValue({
      introduction: 'Введение в урок 1',
      key_points: ['Пункт 1', 'Пункт 2', 'Пункт 3', 'Пункт 4'],
      practical_tips: ['Совет 1', 'Совет 2', 'Совет 3'],
      homework: 'Домашнее задание',
      motivational_line: 'Мотивация',
    });

    vi.mocked(personalizeLesson).mockResolvedValue({
      introduction: 'Персонализированное введение',
      key_points: ['Персональный пункт 1', 'Персональный пункт 2', 'Персональный пункт 3', 'Персональный пункт 4'],
      practical_tips: ['Персональный совет 1', 'Персональный совет 2', 'Персональный совет 3'],
      homework: 'Персональное задание',
      motivational_line: 'Персональная мотивация',
    });

    vi.mocked(getPersonalization).mockResolvedValue({
      introduction: 'Персонализированное введение',
      key_points: ['Персональный пункт 1', 'Персональный пункт 2', 'Персональный пункт 3', 'Персональный пункт 4'],
      practical_tips: ['Персональный совет 1', 'Персональный совет 2', 'Персональный совет 3'],
      homework: 'Персональное задание',
      motivational_line: 'Персональная мотивация',
    });

    const request = new NextRequest('http://localhost/api/survey', {
      method: 'POST',
      body: JSON.stringify({
        real_name: 'Тест Пользователь',
        course: 'shvz',
        uid: 'test_user',
        experience: 'beginner',
        goals: 'health',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.profileId).toBe('profile-1');
    expect(data.userIdentifier).toBe('test_user');
    expect(data.firstLessonPreview).toBeDefined();
    expect(data.firstLessonPreview.html).toContain('Персонализированное введение');
    expect(data.firstLessonPreview.lessonNumber).toBe(1);
    expect(data.firstLessonPreview.lessonTitle).toBe('Урок 1');
  });

  it('should validate required fields', async () => {
    const request = new NextRequest('http://localhost/api/survey', {
      method: 'POST',
      body: JSON.stringify({
        real_name: '',
        course: '',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('обязательны');
  });

  it('should handle case when no lessons found', async () => {
    const { createSupabaseServerClient } = await import('@/lib/supabase/server');
    const { upsertProfile } = await import('@/lib/services/profile');
    
    const mockSupabase = createSupabaseServerClient();
    
    vi.mocked(mockSupabase.from).mockImplementation((table: string) => {
      if (table === 'courses') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: { id: 'course-1' }
              }),
            })),
          })),
        } as any;
      } else if (table === 'lessons') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            })),
          })),
        } as any;
      }
      return {} as any;
    });

    vi.mocked(upsertProfile).mockResolvedValue({
      id: 'profile-1',
      user_identifier: 'test_user',
      name: 'Тест Пользователь',
      course_slug: 'shvz',
      survey: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    const request = new NextRequest('http://localhost/api/survey', {
      method: 'POST',
      body: JSON.stringify({
        real_name: 'Тест Пользователь',
        course: 'shvz',
        experience: 'beginner',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.profileId).toBe('profile-1');
    expect(data.warning).toContain('уроки не найдены');
    expect(data.firstLessonPreview).toBeUndefined();
  });

  it('should handle first lesson preview fetch failure gracefully', async () => {
    const { createSupabaseServerClient } = await import('@/lib/supabase/server');
    const { upsertProfile } = await import('@/lib/services/profile');
    const { personalizeLesson } = await import('@/lib/services/openai');
    const { loadLessonTemplate } = await import('@/lib/services/lesson-templates');
    const { getPersonalization } = await import('@/lib/services/personalization');
    
    const mockSupabase = createSupabaseServerClient();
    
    vi.mocked(mockSupabase.from).mockImplementation((table: string) => {
      if (table === 'courses') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: { id: 'course-1' }
              }),
            })),
          })),
        } as any;
      } else if (table === 'lessons') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn().mockResolvedValue({
                data: [
                  { id: 'lesson-1', lesson_number: 1, title: 'Урок 1', summary: 'Первый урок' },
                ],
                error: null,
              }),
            })),
          })),
        } as any;
      }
      return {} as any;
    });

    vi.mocked(upsertProfile).mockResolvedValue({
      id: 'profile-1',
      user_identifier: 'test_user',
      name: 'Тест Пользователь',
      course_slug: 'shvz',
      survey: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    vi.mocked(loadLessonTemplate).mockResolvedValue({
      introduction: 'Введение',
      key_points: ['Пункт 1', 'Пункт 2', 'Пункт 3', 'Пункт 4'],
      practical_tips: ['Совет 1', 'Совет 2', 'Совет 3'],
      homework: 'Задание',
      motivational_line: 'Мотивация',
    });

    vi.mocked(personalizeLesson).mockResolvedValue({
      introduction: 'Персонализированное введение',
      key_points: ['Пункт 1', 'Пункт 2', 'Пункт 3', 'Пункт 4'],
      practical_tips: ['Совет 1', 'Совет 2', 'Совет 3'],
      homework: 'Задание',
      motivational_line: 'Мотивация',
    });

    // Mock getPersonalization to throw error
    vi.mocked(getPersonalization).mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost/api/survey', {
      method: 'POST',
      body: JSON.stringify({
        real_name: 'Тест Пользователь',
        course: 'shvz',
        experience: 'beginner',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    // Should still succeed but without preview
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.firstLessonPreview).toBeUndefined();
  });
});
