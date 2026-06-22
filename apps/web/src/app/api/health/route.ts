import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * GET /api/health
 * Health check endpoint for monitoring (UptimeRobot, etc.)
 * Checks: database connectivity, response time
 */
export async function GET() {
  const startTime = Date.now();
  const checks: Record<string, { status: string; latency?: number }> = {};

  // Database check
  try {
    await db.$queryRaw`SELECT 1`;
    checks.database = { status: 'ok', latency: Date.now() - startTime };
  } catch {
    checks.database = { status: 'error' };
    return NextResponse.json({
      status: 'unhealthy',
      checks,
      timestamp: new Date().toISOString(),
    }, { status: 503 });
  }

  return NextResponse.json({
    status: 'healthy',
    checks,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    uptime: process.uptime ? Math.floor(process.uptime()) : null,
  });
}
