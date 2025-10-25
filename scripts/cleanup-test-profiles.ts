#!/usr/bin/env node
/**
 * Clean up test profiles before migration
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function cleanup() {
  console.log('🧹 Cleaning up test profiles...\n');

  const testUsers = ['12345', '21179358', 'test_user_123'];

  for (const userId of testUsers) {
    console.log(`Deleting profile: ${userId}`);
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('user_identifier', userId);

    if (error) {
      console.log(`  ⚠️  ${error.message}`);
    } else {
      console.log(`  ✅ Deleted`);
    }
  }

  console.log('\n✨ Cleanup completed!');
  console.log('\n📝 Next steps:');
  console.log('1. Apply migration in Supabase Dashboard');
  console.log('2. Run: npx tsx --env-file=.env.local scripts/test-multi-course-survey.ts');
}

cleanup();
