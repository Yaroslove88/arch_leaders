import { NextResponse } from 'next/server';

/**
 * Health check endpoint for Docker/Timeweb
 * Returns 200 OK if server is running
 */
export async function GET() {
  return NextResponse.json(
    { 
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'web'
    },
    { status: 200 }
  );
}
