/**
 * Transcription Service
 * 
 * Handles audio transcription using OpenAI Whisper API.
 * Features:
 * - Transcribe audio chunks with rate limiting
 * - Assemble chunks into full transcript
 * - Validate transcript quality
 */

import { getOpenAIClient } from './openai';
import { chunkAudio } from './video-processing';
import fs from 'fs';
import path from 'path';

export interface TranscriptChunk {
  index: number;
  text: string;
  duration: number;
  language?: string;
}

export interface TranscriptResult {
  text: string;
  duration: number;
  language: string;
  characterCount: number;
}

/**
 * Transcribe a single audio chunk using OpenAI Whisper
 * 
 * @param chunkPath Path to audio chunk file
 * @param index Chunk index for ordering
 * @param language Language hint (default: 'ru' for Russian)
 * @returns Transcript chunk with metadata
 */
export async function transcribeChunk(
  chunkPath: string,
  index: number,
  language: string = 'ru'
): Promise<TranscriptChunk> {
  const openai = getOpenAIClient();

  if (!fs.existsSync(chunkPath)) {
    throw new Error(`Audio chunk file not found: ${chunkPath}`);
  }

  try {
    console.log(`🎤 Transcribing chunk ${index}: ${path.basename(chunkPath)}`);
    
    const response = await openai.audio.transcriptions.create({
      file: fs.createReadStream(chunkPath),
      model: 'whisper-1',
      language: language,
      response_format: 'verbose_json',
      temperature: 0.2, // balance between accuracy and determinism
    });

    const chunk: TranscriptChunk = {
      index,
      text: response.text,
      duration: response.duration || 0,
      language: response.language,
    };

    console.log(`   ✅ Transcribed ${chunk.text.length} characters (${chunk.duration.toFixed(1)}s)`);
    
    return chunk;
  } catch (error: any) {
    console.error(`   ❌ Error transcribing chunk ${index}:`, error.message);
    throw new Error(`Failed to transcribe chunk ${index}: ${error.message}`);
  }
}

/**
 * Process multiple audio chunks with rate limiting
 * 
 * OpenAI Whisper API limit: 50 requests/minute
 * 
 * @param chunkPaths Array of audio chunk file paths
 * @param language Language hint
 * @returns Array of transcript chunks in order
 */
export async function transcribeChunksWithRateLimit(
  chunkPaths: string[],
  language: string = 'ru'
): Promise<TranscriptChunk[]> {
  const results: TranscriptChunk[] = [];
  const delayMs = 1200; // ~50 requests/min (with safety margin)
  
  console.log(`📝 Transcribing ${chunkPaths.length} audio chunks...`);
  
  for (let i = 0; i < chunkPaths.length; i++) {
    console.log(`\n[${i + 1}/${chunkPaths.length}]`);
    
    try {
      const chunk = await transcribeChunk(chunkPaths[i], i, language);
      results.push(chunk);
    } catch (error: any) {
      // Retry once on failure
      console.log(`   🔄 Retrying chunk ${i}...`);
      try {
        await new Promise(resolve => setTimeout(resolve, 2000)); // wait 2s before retry
        const chunk = await transcribeChunk(chunkPaths[i], i, language);
        results.push(chunk);
      } catch (retryError: any) {
        throw new Error(`Failed to transcribe chunk ${i} after retry: ${retryError.message}`);
      }
    }
    
    // Wait before next request (except for last chunk)
    if (i < chunkPaths.length - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  console.log(`\n✅ All chunks transcribed successfully`);
  return results;
}

/**
 * Assemble transcript chunks into full text
 * 
 * @param chunks Array of transcript chunks
 * @returns Complete transcript text
 */
export function assembleTranscript(chunks: TranscriptChunk[]): string {
  // Sort by index to ensure correct order
  const sorted = chunks.sort((a, b) => a.index - b.index);
  
  // Concatenate text with space separator
  const fullText = sorted.map(c => c.text.trim()).join(' ');
  
  // Basic cleanup: remove excessive whitespace
  return fullText.replace(/\s+/g, ' ').trim();
}

/**
 * Validate transcript quality
 * 
 * @param transcript Transcript text to validate
 * @param minLength Minimum character count (default: 500)
 * @returns Validation result with warnings
 */
export function validateTranscript(
  transcript: string,
  minLength: number = 500
): { valid: boolean; warnings: string[] } {
  const warnings: string[] = [];
  
  // Check length
  if (transcript.length < minLength) {
    warnings.push(`Transcript is very short (${transcript.length} characters, expected at least ${minLength})`);
  }
  
  // Check UTF-8 encoding (basic check)
  try {
    Buffer.from(transcript, 'utf8');
  } catch (error) {
    warnings.push('Transcript contains invalid UTF-8 characters');
  }
  
  // Check for suspicious patterns
  if (transcript.includes('�')) {
    warnings.push('Transcript contains replacement characters (encoding issues)');
  }
  
  // Estimate word count (rough approximation for Russian text)
  const wordCount = transcript.split(/\s+/).length;
  if (wordCount < 50) {
    warnings.push(`Very low word count: ${wordCount} words`);
  }
  
  return {
    valid: warnings.length === 0,
    warnings,
  };
}

/**
 * Main function: Transcribe audio file (handles chunking automatically)
 * 
 * @param audioPath Path to audio file (MP3)
 * @param courseSlug Course identifier for file organization
 * @param lessonNumber Lesson number
 * @param language Language hint (default: 'ru')
 * @returns Complete transcript with metadata
 */
export async function transcribeAudioFile(
  audioPath: string,
  courseSlug: string,
  lessonNumber: number,
  language: string = 'ru'
): Promise<TranscriptResult> {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🎤 Starting transcription for lesson ${lessonNumber}`);
  console.log(`${'='.repeat(60)}\n`);
  
  if (!fs.existsSync(audioPath)) {
    throw new Error(`Audio file not found: ${audioPath}`);
  }

  const chunkDir = path.join(
    process.cwd(),
    'store',
    courseSlug,
    'audio',
    'chunks',
    lessonNumber.toString()
  );

  // Check if audio file is small enough to process directly
  const stats = fs.statSync(audioPath);
  const sizeMB = stats.size / (1024 * 1024);
  
  let chunks: TranscriptChunk[];
  
  if (sizeMB < 20) {
    // Process single file
    console.log(`📄 Audio file is ${sizeMB.toFixed(1)} MB (under 20 MB), processing directly...\n`);
    const chunk = await transcribeChunk(audioPath, 0, language);
    chunks = [chunk];
  } else {
    // Chunk and process
    console.log(`📦 Audio file is ${sizeMB.toFixed(1)} MB, chunking required...\n`);
    
    // Create chunk directory
    if (!fs.existsSync(chunkDir)) {
      fs.mkdirSync(chunkDir, { recursive: true });
    }
    
    const chunkPaths = await chunkAudio({
      inputPath: audioPath,
      outputDir: chunkDir,
      segmentDuration: 600, // 10 minutes
      maxSizeMB: 20,
    });
    
    console.log(`\n✅ Created ${chunkPaths.length} chunks, starting transcription...\n`);
    chunks = await transcribeChunksWithRateLimit(chunkPaths, language);
  }

  // Assemble full transcript
  console.log('\n📋 Assembling full transcript...');
  const fullText = assembleTranscript(chunks);
  const totalDuration = chunks.reduce((sum, c) => sum + c.duration, 0);
  const detectedLanguage = chunks[0]?.language || language;

  // Validate transcript
  const validation = validateTranscript(fullText);
  if (!validation.valid) {
    console.warn('\n⚠️  Transcript validation warnings:');
    validation.warnings.forEach(w => console.warn(`   - ${w}`));
  }

  // Clean up chunk files if they exist
  if (fs.existsSync(chunkDir)) {
    console.log('\n🗑️  Cleaning up temporary chunk files...');
    try {
      fs.rmSync(chunkDir, { recursive: true, force: true });
      console.log('   ✅ Cleanup complete');
    } catch (error: any) {
      console.warn(`   ⚠️  Cleanup failed: ${error.message}`);
    }
  }

  const result: TranscriptResult = {
    text: fullText,
    duration: totalDuration,
    language: detectedLanguage,
    characterCount: fullText.length,
  };

  console.log(`\n✅ Transcription complete!`);
  console.log(`   Characters: ${result.characterCount.toLocaleString()}`);
  console.log(`   Duration: ${result.duration.toFixed(1)}s`);
  console.log(`   Language: ${result.language}`);
  console.log(`${'='.repeat(60)}\n`);

  return result;
}
