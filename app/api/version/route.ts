import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    version: '2.0.0-multi-course-db-templates',
    timestamp: new Date().toISOString(),
    features: [
      'Multi-course support with course parameter',
      'Database-based template loading (primary)',
      'File system template loading (fallback for shvz)',
      'Course-aware lesson lookup'
    ],
    lastUpdate: '2025-01-23 - Load templates from DB instead of file system'
  });
}
