#!/usr/bin/env node
/**
 * Apply migration 003: Fix multi-course profile support
 * This migration allows users to have separate profiles for different courses
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL');
  console.error('   Required: NEXT_PUBLIC_SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  console.log('🔄 Applying migration 003: Fix multi-course profile support\n');

  // Read migration file
  const migrationPath = path.join(process.cwd(), 'migrations', '003_fix_multi_course_profiles.sql');
  const sql = fs.readFileSync(migrationPath, 'utf-8');

  console.log('📄 Migration SQL:');
  console.log('─'.repeat(60));
  console.log(sql);
  console.log('─'.repeat(60));
  console.log();

  // Check current profiles
  console.log('📊 Checking current profiles...');
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('user_identifier, course_slug, name')
    .order('created_at', { ascending: false });

  if (profilesError) {
    console.error('❌ Error fetching profiles:', profilesError);
  } else {
    console.log(`   Found ${profiles?.length || 0} profiles:\n`);
    profiles?.forEach((p, i) => {
      console.log(`   ${i + 1}. User: ${p.user_identifier} | Course: ${p.course_slug} | Name: ${p.name}`);
    });
    console.log();
  }

  // Warning
  console.log('⚠️  WARNING:');
  console.log('   This migration will:');
  console.log('   1. Drop unique constraint on user_identifier');
  console.log('   2. Add composite unique constraint on (user_identifier, course_slug)');
  console.log('   3. Make course_slug NOT NULL');
  console.log();
  console.log('   If any profile has course_slug = NULL, migration will FAIL!');
  console.log();

  // Check for NULL course_slugs
  const { data: nullProfiles } = await supabase
    .from('profiles')
    .select('user_identifier, name')
    .is('course_slug', null);

  if (nullProfiles && nullProfiles.length > 0) {
    console.error('❌ Found profiles with NULL course_slug:');
    nullProfiles.forEach((p) => {
      console.error(`   - User: ${p.user_identifier} | Name: ${p.name}`);
    });
    console.error('\n   Please fix these profiles before running migration!');
    process.exit(1);
  }

  console.log('✅ All profiles have course_slug set\n');
  console.log('🚀 Ready to apply migration!\n');
  console.log('⚠️  NOTE: Use Supabase SQL Editor to run this migration manually:');
  console.log('   https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new');
  console.log('\n   Copy-paste the SQL above into the editor and click "Run"');
  console.log('\n   Reason: RPC/SQL execution via API requires service role key with proper permissions');
}

applyMigration();
