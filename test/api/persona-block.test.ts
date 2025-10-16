import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from '@/app/api/persona/block/route';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: vi.fn(() => ({
    from: vi.fn((table: string) => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(),
        })),
        ilike: vi.fn(() => ({
          limit: vi.fn(() => ({
            maybeSingle: vi.fn(),
          })),
        })),
      })),
    })),
  })),
}));

vi.mock('@/lib/services/personalization', () => ({
  getPersonalization: vi.fn(),
}));

vi.mock('@/lib/services/lesson-templates', () => ({
  loadLessonTemplate: vi.fn(),
}));

describe('POST /api/persona/block - Default Template Fallback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return default template HTML when user not found', async () => {
    // Mock Supabase to return no profile but valid lesson
    const { createSupabaseServerClient } = await import('@/lib/supabase/server');
    const { loadLessonTemplate } = await import('@/lib/services/lesson-templates');
    
    const mockSupabase = createSupabaseServerClient();
    let callCount = 0;
    
    vi.mocked(mockSupabase.from).mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValue({ data: null }), // No profile
            })),
          })),
        } as any;
      } else if (table === 'lessons') {
        callCount++;
        if (callCount === 1) {
          // First call with ilike
          return {
            select: vi.fn(() => ({
              ilike: vi.fn(() => ({
                limit: vi.fn(() => ({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: { id: 'lesson-1', title: 'Урок 1', lesson_number: 1 }
                  }),
                })),
              })),
            })),
          } as any;
        }
      }
      return {} as any;
    });

    vi.mocked(loadLessonTemplate).mockResolvedValue({
      introduction: 'Тестовое введение',
      key_points: ['Пункт 1', 'Пункт 2', 'Пункт 3', 'Пункт 4'],
      practical_tips: ['Совет 1', 'Совет 2', 'Совет 3'],
      homework: 'Тестовое задание',
      motivational_line: 'Тестовая мотивация',
    });

    const request = new NextRequest('http://localhost/api/persona/block', {
      method: 'POST',
      body: JSON.stringify({
        user_id: 'nonexistent_user',
        lesson: 'урок-1',
        title: 'Урок 1',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.html).toBeDefined();
    expect(data.html).toContain('persona-default');
    expect(data.html).toContain('Базовая версия урока');
    expect(data.html).toContain('Тестовое введение');
    expect(data.html).toContain('Заполните анкету');
  });

  it('should validate required fields', async () => {
    const request = new NextRequest('http://localhost/api/persona/block', {
      method: 'POST',
      body: JSON.stringify({
        user_id: '',
        lesson: '',
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
      if (table === 'profiles') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValue({ data: null }),
            })),
          })),
        } as any;
      } else if (table === 'lessons') {
        return {
          select: vi.fn(() => ({
            ilike: vi.fn(() => ({
              limit: vi.fn(() => ({
                maybeSingle: vi.fn().mockResolvedValue({ data: null }), // No lesson
              })),
            })),
            eq: vi.fn(() => ({
              limit: vi.fn(() => ({
                maybeSingle: vi.fn().mockResolvedValue({ data: null }),
              })),
            })),
          })),
        } as any;
      }
      return {} as any;
    });

    const request = new NextRequest('http://localhost/api/persona/block', {
      method: 'POST',
      body: JSON.stringify({
        user_id: 'test_user',
        lesson: '999',
        title: 'Nonexistent Lesson',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.html).toContain('не найден');
  });
});
