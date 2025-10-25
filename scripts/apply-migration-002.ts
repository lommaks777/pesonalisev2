/**
 * Apply migration 002: Add default_description column
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function applyMigration() {
  console.log("🔧 Applying migration: Add default_description column...\n");

  try {
    // Since we can't run DDL via RPC with anon key,
    // we'll just try to insert and see if the column exists
    const { data, error } = await supabase
      .from("lessons")
      .select("id, default_description")
      .limit(1);

    if (error) {
      if (error.message.includes("default_description")) {
        console.log("❌ Column default_description doesn't exist yet");
        console.log("\n📋 Please run this SQL in Supabase SQL Editor:");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("ALTER TABLE lessons");
        console.log("ADD COLUMN IF NOT EXISTS default_description jsonb;");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
        return false;
      }
      throw error;
    }

    console.log("✅ Column default_description already exists or migration successful!\n");
    return true;

  } catch (error) {
    console.error("❌ Error checking migration:", error);
    return false;
  }
}

applyMigration().then((success) => {
  if (success) {
    console.log("✅ Ready to generate default descriptions");
    console.log("\nRun: npx tsx --env-file=.env.local scripts/generate-default-descriptions.ts kinesio2");
  }
  process.exit(success ? 0 : 1);
});
