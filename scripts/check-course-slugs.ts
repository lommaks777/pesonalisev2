#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function check() {
  const { data } = await s.from('courses').select('slug, title');
  console.log('📚 Courses in database:\n');
  data?.forEach(c => {
    console.log(`   Slug: "${c.slug}"`);
    console.log(`   Title: ${c.title}\n`);
  });
}

check();
