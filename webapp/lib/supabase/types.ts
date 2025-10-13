type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      courses: {
        Row: {
          id: string;
          slug: string;
          title: string;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          title?: string;
          description?: string | null;
          created_at?: string;
        };
      };
      lessons: {
        Row: {
          id: string;
          course_id: string;
          lesson_number: number;
          title: string;
          summary: string | null;
          content: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          course_id: string;
          lesson_number: number;
          title: string;
          summary?: string | null;
          content?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          course_id?: string;
          lesson_number?: number;
          title?: string;
          summary?: string | null;
          content?: Json | null;
          created_at?: string;
        };
      };
      lesson_descriptions: {
        Row: {
          id: string;
          lesson_id: string;
          data: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          lesson_id: string;
          data: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          lesson_id?: string;
          data?: Json;
          created_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          user_identifier: string;
          name: string | null;
          course_slug: string | null;
          survey: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_identifier: string;
          name?: string | null;
          course_slug?: string | null;
          survey?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_identifier?: string;
          name?: string | null;
          course_slug?: string | null;
          survey?: Json | null;
          created_at?: string;
        };
      };
      personalized_lesson_descriptions: {
        Row: {
          id: string;
          profile_id: string;
          lesson_id: string;
          content: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          lesson_id: string;
          content: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          lesson_id?: string;
          content?: Json;
          created_at?: string;
        };
      };
    };
  };
}




