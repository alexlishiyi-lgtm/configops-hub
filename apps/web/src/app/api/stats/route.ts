import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { getWorkspace } from '@/lib/workspace';

/**
 * GET /api/stats
 * Returns dashboard statistics for the current workspace.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const ctx = await getWorkspace();
  if (!ctx) {
    return NextResponse.json({ error: 'No workspace found' }, { status: 404 });
  }

  const workspaceId = ctx.workspace.id;

  const [configCount, todayChanges, packageCount, memberCount, recentLogs, envCounts] = await Promise.all([
    db.config.count({ where: { workspaceId } }),
    db.auditLog.count({
      where: {
        workspaceId,
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    }),
    db.package.count({ where: { workspaceId } }),
    db.member.count({ where: { workspaceId } }),
    db.auditLog.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
      take: 8,
      include: {
        // We don't have a direct relation to User in AuditLog, but we store userId
      },
    }),
    db.config.groupBy({
      by: ['environment'],
      where: { workspaceId },
      _count: true,
    }),
  ]);

  const envStats: Record<string, number> = { DEV: 0, TEST: 0, PROD: 0 };
  for (const item of envCounts) {
    envStats[item.environment] = item._count;
  }

  // Get user names for recent logs
  const userIds = recentLogs.map((l) => l.userId).filter(Boolean) as string[];
  const users = await db.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true },
  });
  const userMap = new Map(users.map((u) => [u.id, u]));

  const recentChanges = recentLogs.map((log) => {
    const user = log.userId ? userMap.get(log.userId) : null;
    const detail = log.detail as Record<string, unknown> | null;
    return {
      id: log.id,
      action: log.action,
      resource: log.resource,
      key: detail?.key ?? log.resource,
      environment: detail?.environment ?? null,
      user: user?.name ?? user?.email ?? '系统',
      createdAt: log.createdAt.toISOString(),
    };
  });

  return NextResponse.json({
    stats: {
      configCount,
      todayChanges,
      packageCount,
      memberCount,
      envStats,
    },
    recentChanges,
  });
}
