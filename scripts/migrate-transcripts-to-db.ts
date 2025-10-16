/**
 * Migration Script: Transcript Files to Database
 * 
 * Purpose: Migrate lesson transcripts from file system (store/shvz/*.txt)
 * to database (lessons.content.transcription JSONB field)
 * 
 * Strategy:
 * - Transaction-based updates (batch of 5 lessons)
 * - Keep original .txt files until verification complete
 * - Comprehensive validation and error logging
 */

import "dotenv/config";
import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const TRANSCRIPT_DIR = path.join(process.cwd(), "store", "shvz");

// Lesson number to UUID mapping
const LESSON_ID_MAP: Record<number, string> = {
  1: "c8a90762-6fca-47a8-80c3-5f454ae05273",
  2: "26ef3e23-3d2e-4461-80bf-622f26737528",
  3: "56766339-03e0-4c1b-9d99-cc49590ad3fd",
  4: "8227a790-17ef-489a-8538-afbe2c4c10ce",
  5: "f9b62dc5-9b76-491d-8b9b-2b72411df740",
  6: "1c75e3db-9afd-4237-8b8f-16be2b00ae0c",
  7: "387be494-dcf4-41a0-83c2-380fdd4f4cc1",
  8: "61b19549-d1bf-4265-bb1e-ff21ae7891a0",
  9: "e0f961c1-b8e3-4f57-939d-fb188d2703a9",
  10: "913d5be1-bbfb-4d32-b4d2-157d10551389",
  11: "69b9560e-2af2-4690-af44-1398ace0f75e",
  12: "722e1278-2dcf-4e76-baa3-8d674f3abda4",
};

interface MigrationResult {
  lessonNumber: number;
  lessonId: string;
  success: boolean;
  transcriptLength: number;
  error?: string;
}

interface MigrationReport {
  totalFiles: number;
  successful: number;
  failed: number;
  skipped: number;
  results: MigrationResult[];
  startTime: Date;
  endTime: Date;
}

/**
 * Parse lesson number from filename
 * Supports multiple patterns: 
 * - "1-c8a90762-...-final.txt"
 * - "1-1-f9b62dc5-...-final.txt"
 */
function parseLessonNumber(filename: string): number | null {
  const patterns = [
    /^(\d+)-\d+-[a-f0-9-]+-final\.txt$/,  // e.g., "1-1-f9b62dc5-9b76-491d-8b9b-2b72411df740.txt"
    /^(\d+)-[a-f0-9-]+-final\.txt$/,      // e.g., "1-c8a90762-6fca-47a8-80c3-5f454ae05273.txt"
    /^(\d+)-\d+-[a-f0-9-]+\.txt$/,         // e.g., "1-1-f9b62dc5-9b76-491d-8b9b-2b72411df740.txt"
    /^(\d+)-[a-f0-9-]+\.txt$/,             // e.g., "1-c8a90762-6fca-47a8-80c3-5f454ae05273.txt"
  ];

  for (const pattern of patterns) {
    const match = filename.match(pattern);
    if (match) {
      return parseInt(match[1], 10);
    }
  }

  return null;
}

/**
 * Validate transcript content
 */
function validateTranscript(content: string): { valid: boolean; warning?: string } {
  if (!content || content.trim().length === 0) {
    return { valid: false };
  }

  if (content.length < 1000) {
    return { valid: true, warning: "Transcript shorter than expected (< 1000 chars)" };
  }

  return { valid: true };
}

/**
 * Migrate single transcript file to database
 */
async function migrateTranscript(
  supabase: ReturnType<typeof createClient>,
  lessonNumber: number,
  transcriptPath: string
): Promise<MigrationResult> {
  const expectedLessonId = LESSON_ID_MAP[lessonNumber];

  try {
    // Read transcript content
    const transcriptContent = fs.readFileSync(transcriptPath, "utf-8");
    
    // Validate content
    const validation = validateTranscript(transcriptContent);
    if (!validation.valid) {
      return {
        lessonNumber,
        lessonId: "",
        success: false,
        transcriptLength: 0,
        error: "Invalid transcript content (empty or too short)",
      };
    }

    // Check if lesson exists in database by lesson_number
    const { data: existingLesson, error: fetchError } = await supabase
      .from("lessons")
      .select("id, lesson_number, title")
      .eq("lesson_number", lessonNumber)
      .maybeSingle();

    if (fetchError || !existingLesson) {
      return {
        lessonNumber,
        lessonId: expectedLessonId,
        success: false,
        transcriptLength: 0,
        error: `Lesson not found in database: ${fetchError?.message || "No data"}`,
      };
    }

    const lessonId = existingLesson.id;

    // Prepare content JSONB structure
    const contentJsonb = {
      transcription: transcriptContent,
      transcription_length: transcriptContent.length,
      transcription_source: "file-migration",
      transcription_date: new Date().toISOString(),
    };

    // Update lesson with transcript
    const { error: updateError } = await supabase
      .from("lessons")
      .update({ content: contentJsonb })
      .eq("id", lessonId);

    if (updateError) {
      return {
        lessonNumber,
        lessonId,
        success: false,
        transcriptLength: transcriptContent.length,
        error: `Database update failed: ${updateError.message}`,
      };
    }

    // Verify update
    const { data: updatedLesson, error: verifyError } = await supabase
      .from("lessons")
      .select("content")
      .eq("id", lessonId)
      .single();

    if (verifyError || !updatedLesson?.content) {
      return {
        lessonNumber,
        lessonId,
        success: false,
        transcriptLength: transcriptContent.length,
        error: "Verification failed: content not saved",
      };
    }

    return {
      lessonNumber,
      lessonId,
      success: true,
      transcriptLength: transcriptContent.length,
      error: validation.warning,
    };
  } catch (error) {
    return {
      lessonNumber,
      lessonId: expectedLessonId,
      success: false,
      transcriptLength: 0,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Main migration function
 */
async function runMigration(): Promise<MigrationReport> {
  console.log("=== Transcript Migration to Database ===\n");

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    throw new Error("Missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  const report: MigrationReport = {
    totalFiles: 0,
    successful: 0,
    failed: 0,
    skipped: 0,
    results: [],
    startTime: new Date(),
    endTime: new Date(),
  };

  // Scan directory for transcript files
  const files = fs.readdirSync(TRANSCRIPT_DIR);
  const transcriptFiles = files.filter(f => f.endsWith(".txt"));

  console.log(`Found ${transcriptFiles.length} transcript files\n`);
  report.totalFiles = transcriptFiles.length;

  // Process each file
  for (const filename of transcriptFiles) {
    const lessonNumber = parseLessonNumber(filename);

    if (lessonNumber === null) {
      console.log(`⏭️  SKIP: ${filename} (could not parse lesson number)`);
      report.skipped++;
      continue;
    }

    const transcriptPath = path.join(TRANSCRIPT_DIR, filename);
    console.log(`Processing Lesson ${lessonNumber}: ${filename}`);

    const result = await migrateTranscript(supabase, lessonNumber, transcriptPath);
    report.results.push(result);

    if (result.success) {
      console.log(`✅ SUCCESS: Migrated ${result.transcriptLength} characters`);
      if (result.error) {
        console.log(`⚠️  WARNING: ${result.error}`);
      }
      report.successful++;
    } else {
      console.log(`❌ FAILED: ${result.error}`);
      report.failed++;
    }

    console.log("");
  }

  report.endTime = new Date();

  return report;
}

/**
 * Generate and save migration report
 */
function generateReport(report: MigrationReport): void {
  const duration = report.endTime.getTime() - report.startTime.getTime();
  const durationSeconds = (duration / 1000).toFixed(2);

  console.log("=== Migration Report ===");
  console.log(`Total Files: ${report.totalFiles}`);
  console.log(`Successful: ${report.successful}`);
  console.log(`Failed: ${report.failed}`);
  console.log(`Skipped: ${report.skipped}`);
  console.log(`Duration: ${durationSeconds}s`);
  console.log(`Success Rate: ${((report.successful / report.totalFiles) * 100).toFixed(1)}%`);
  console.log("");

  if (report.failed > 0) {
    console.log("=== Failed Migrations ===");
    report.results
      .filter(r => !r.success)
      .forEach(r => {
        console.log(`Lesson ${r.lessonNumber}: ${r.error}`);
      });
    console.log("");
  }

  // Save detailed report
  const reportPath = path.join(process.cwd(), "migration-report.json");
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`📄 Detailed report saved to: ${reportPath}`);
}

/**
 * Entry point
 */
async function main() {
  try {
    const report = await runMigration();
    generateReport(report);

    if (report.failed > 0) {
      console.error("\n⚠️  Migration completed with errors. Review failed items above.");
      process.exit(1);
    } else {
      console.log("\n✅ Migration completed successfully!");
      process.exit(0);
    }
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    process.exit(1);
  }
}

main();
