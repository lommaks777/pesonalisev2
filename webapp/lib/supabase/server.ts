import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
}

const supabaseKey = serviceRoleKey ?? anonKey;

if (!supabaseKey) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY must be set");
}

export function createSupabaseServerClient() {
  return createClient<Database>(url, supabaseKey, {
    auth: {
      persistSession: false,
    },
  });
}

