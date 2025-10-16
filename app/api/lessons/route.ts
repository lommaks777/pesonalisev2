import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CORS_HEADERS, createOptionsHandler } from "@/lib/utils/http";

export async function GET() {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("lessons")
    .select("id, lesson_number, title, summary, lesson_descriptions(data)")
    .order("lesson_number", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: CORS_HEADERS });
  }

  return NextResponse.json({ lessons: data }, { headers: CORS_HEADERS });
}

export const OPTIONS = createOptionsHandler();



