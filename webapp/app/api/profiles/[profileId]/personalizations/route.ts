import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

interface Params {
  profileId: string;
}

export async function GET(
  _request: Request,
  context: { params: Params }
) {
  const { profileId } = context.params;

  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("personalized_lesson_descriptions")
    .select("lesson_id, content")
    .eq("profile_id", profileId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ personalizations: data ?? [] });
}




