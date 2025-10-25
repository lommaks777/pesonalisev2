#!/usr/bin/env node
/**
 * Test lesson lookup with course parameter
 * Simulates API /persona/block request
 */

async function testLessonLookup() {
  const API = "https://pesonalisev2-zxby.vercel.app/api/persona";
  
  console.log('🧪 Testing lesson lookup with course parameter\n');

  // Test 1: Lesson 2 from shvz course
  console.log('Test 1: Lesson 2 from shvz course');
  console.log('─'.repeat(50));
  
  const test1 = await fetch(`${API}/block`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ 
      user_id: '21179358', 
      lesson: '2',
      title: 'Test Lesson 2',
      course: 'massazh-shvz',
      flush: false 
    })
  });
  
  const data1 = await test1.json();
  console.log('Response status:', test1.status);
  console.log('Response OK:', data1.ok);
  
  if (data1.html) {
    // Extract lesson title from HTML
    const titleMatch = data1.html.match(/<h3[^>]*>(.*?)<\/h3>/);
    const title = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, '') : 'Unknown';
    console.log('Lesson found:', title);
    
    // Check if it's from correct course
    if (title.includes('Мышцы') || title.includes('ШВЗ')) {
      console.log('✅ Correct! This is from shvz course\n');
    } else if (title.includes('Тейп') || title.includes('морщин')) {
      console.log('❌ WRONG! This is from kinesio2 course\n');
    } else {
      console.log('⚠️  Unknown lesson\n');
    }
  } else {
    console.log('Error:', data1.error || 'Unknown error\n');
  }

  // Test 2: Lesson 2 from kinesio2 course
  console.log('Test 2: Lesson 2 from kinesio2 course');
  console.log('─'.repeat(50));
  
  const test2 = await fetch(`${API}/block`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ 
      user_id: '21179358', 
      lesson: '2',
      title: 'Test Lesson 2',
      course: 'kinesio2',
      flush: false 
    })
  });
  
  const data2 = await test2.json();
  console.log('Response status:', test2.status);
  console.log('Response OK:', data2.ok);
  
  if (data2.html) {
    const titleMatch = data2.html.match(/<h3[^>]*>(.*?)<\/h3>/);
    const title = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, '') : 'Unknown';
    console.log('Lesson found:', title);
    
    if (title.includes('Тейп') || title.includes('морщин') || title.includes('лбу')) {
      console.log('✅ Correct! This is from kinesio2 course\n');
    } else if (title.includes('Мышцы') || title.includes('ШВЗ')) {
      console.log('❌ WRONG! This is from shvz course\n');
    } else {
      console.log('⚠️  Unknown lesson\n');
    }
  } else {
    console.log('Error:', data2.error || 'Unknown error\n');
  }

  console.log('🎉 Tests completed!');
}

testLessonLookup();
