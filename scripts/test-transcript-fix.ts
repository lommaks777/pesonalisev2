import { loadLessonTranscript } from '../lib/services/personalization-engine';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function testTranscriptLoading() {
  console.log('🧪 Testing transcript loading for lesson 1...\n');

  const lessonId = '86f9c6a7-4b43-4beb-a827-ad37a73b3a9b'; // Lesson 1 of taping-basics

  try {
    const transcript = await loadLessonTranscript(lessonId);

    if (!transcript) {
      console.log('❌ FAILED: No transcript returned');
      process.exit(1);
    }

    console.log('✅ SUCCESS: Transcript loaded!');
    console.log(`   Source: ${transcript.transcription_source}`);
    console.log(`   Length: ${transcript.transcription_length} characters`);
    console.log(`   Preview: "${transcript.transcription.substring(0, 100)}..."`);

    if (transcript.transcription_source === 'database_content_json') {
      console.log('\n⚠️  Note: Transcription was loaded from legacy content.transcription field');
      console.log('   Consider migrating to direct transcription field');
    } else {
      console.log('\n✅ Transcription in correct field (direct transcription)');
    }

    console.log('\n🎉 Test PASSED - Personalization should work now!');
    process.exit(0);

  } catch (error) {
    console.error('❌ FAILED with error:', error);
    process.exit(1);
  }
}

testTranscriptLoading();
