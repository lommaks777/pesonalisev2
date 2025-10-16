import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from '@/app/api/persona/personalize-template/route';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(),
        })),
      })),
    })),
  })),
}));

vi.mock('@/lib/services/openai', () => ({
  personalizeLesson: vi.fn(),
}));

vi.mock('@/lib/services/lesson-templates', () => ({
  loadLessonTemplate: vi.fn(),
}));

vi.mock('@/lib/services/personalization', () => ({
  savePersonalization: vi.fn(),
}));

describe('POST /api/persona/personalize-template - Default Template Fallback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return default template HTML when user not found', async () => {
    const { createSupabaseServerClient } = await import('@/lib/supabase/server');
    const { loadLessonTemplate } = await import('@/lib/services/lesson-templates');
    
    const mockSupabase = createSupabaseServerClient();
    
    vi.mocked(mockSupabase.from).mockImplementation((table: string) => {
      if (table === 'lessons') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { id: 'lesson-1', title: 'Урок 1', lesson_number: 1 }
              }),
            })),
          })),
        } as any;
      } else if (table === 'profiles') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValue({ data: null }), // No profile
            })),
          })),
        } as any;
      }
      return {} as any;
    });

    vi.mocked(loadLessonTemplate).mockResolvedValue({
      introduction: 'Урок 1: введение в технику массажа',
      key_points: [
        'Узнаете основные техники работы',
        'Научитесь правильному позиционированию',
        'Поймёте критерии эффективности',
        'Освоите безопасные приёмы работы'
      ],
      practical_tips: [
        'Следите за реакцией клиента',
        'Начинайте с лёгкого давления',
        'Избегайте болезненных ощущений'
      ],
      homework: 'Просмотрите видео урока и попрактикуйтесь 10-15 минут',
      motivational_line: 'Каждая практика приближает вас к мастерству',
    });

    const request = new NextRequest('http://localhost/api/persona/personalize-template', {
      method: 'POST',
      body: JSON.stringify({
        user_id: 'nonexistent_user',
        lesson_number: 1,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.html).toBeDefined();
    expect(data.html).toContain('persona-default');
    expect(data.html).toContain('Базовая версия урока');
    expect(data.html).toContain('введение в технику массажа');
    expect(data.html).toContain('Заполните анкету');
  });

  it('should validate required fields', async () => {
    const request = new NextRequest('http://localhost/api/persona/personalize-template', {
      method: 'POST',
      body: JSON.stringify({
        user_id: '',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.ok).toBe(false);
    expect(data.error).toContain('required');
  });

  it('should return lesson not found when lesson does not exist', async () => {
    const { createSupabaseServerClient } = await import('@/lib/supabase/server');
    
    const mockSupabase = createSupabaseServerClient();
    
    vi.mocked(mockSupabase.from).mockImplementation((table: string) => {
      if (table === 'lessons') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValue({ data: null }), // No lesson
            })),
          })),
        } as any;
      }
      return {} as any;
    });

    const request = new NextRequest('http://localhost/api/persona/personalize-template', {
      method: 'POST',
      body: JSON.stringify({
        user_id: 'test_user',
        lesson_number: 999,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.html).toContain('не найден');
  });

  it('should use default template when template file is missing', async () => {
    const { createSupabaseServerClient } = await import('@/lib/supabase/server');
    const { loadLessonTemplate } = await import('@/lib/services/lesson-templates');
    
    const mockSupabase = createSupabaseServerClient();
    
    vi.mocked(mockSupabase.from).mockImplementation((table: string) => {
      if (table === 'lessons') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { id: 'lesson-99', title: 'Урок 99', lesson_number: 99 }
              }),
            })),
          })),
        } as any;
      } else if (table === 'profiles') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValue({ data: null }),
            })),
          })),
        } as any;
      }
      return {} as any;
    });

    // Mock default template being returned
    vi.mocked(loadLessonTemplate).mockResolvedValue({
      introduction: 'Урок 99: введение в технику массажа',
      key_points: [
        'Узнаете основные техники работы',
        'Научитесь правильному позиционированию',
        'Поймёте критерии эффективности',
        'Освоите безопасные приёмы работы'
      ],
      practical_tips: [
        'Следите за реакцией клиента',
        'Начинайте с лёгкого давления',
        'Избегайте болезненных ощущений'
      ],
      homework: 'Просмотрите видео урока и попрактикуйтесь 10-15 минут',
      motivational_line: 'Каждая практика приближает вас к мастерству',
    });

    const request = new NextRequest('http://localhost/api/persona/personalize-template', {
      method: 'POST',
      body: JSON.stringify({
        user_id: 'test_user',
        lesson_number: 99,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.html).toContain('Урок 99');
  });
});
