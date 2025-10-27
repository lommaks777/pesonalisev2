import fs from 'fs';
import path from 'path';

const storePath = path.join(process.cwd(), 'store', 'shvz');
const lessonNumber = 1;

console.log(`Looking for lesson ${lessonNumber} in ${storePath}\n`);

const files = fs.readdirSync(storePath).filter(f => f.endsWith('.txt'));

console.log('All .txt files:');
files.forEach(f => console.log(`  - ${f}`));

console.log(`\nChecking patterns for lesson ${lessonNumber}:`);

const transcriptFile = files.find(f => {
  if (!f.endsWith('.txt')) return false;
  
  console.log(`  Testing: ${f}`);
  
  // Pattern 1: {N}-{N}-{uuid}.txt
  if (f.startsWith(`${lessonNumber}-${lessonNumber}-`)) {
    console.log(`    ✅ Matched Pattern 1: ${lessonNumber}-${lessonNumber}-`);
    return true;
  }
  
  // Pattern 2: {N}-{uuid}.txt
  const parts = f.split('-');
  if (parts.length >= 2 && parts[0] === String(lessonNumber)) {
    console.log(`    ✅ Matched Pattern 2: ${lessonNumber}-`);
    return true;
  }
  
  console.log(`    ❌ No match`);
  return false;
});

console.log(`\nResult: ${transcriptFile || 'NOT FOUND'}`);

if (transcriptFile) {
  const content = fs.readFileSync(path.join(storePath, transcriptFile), 'utf-8');
  console.log(`\nFile size: ${content.length} characters`);
  console.log(`First 100 chars: ${content.substring(0, 100)}...`);
}
