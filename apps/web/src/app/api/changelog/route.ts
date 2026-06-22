import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { getWorkspace } from '@/lib/workspace';

/**
 * GET /api/changelog?page=1&limit=20&action=CREATE&resource=config
 * Returns paginated audit logs for the current workspace.
 */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const ctx = await getWorkspace();
  if (!ctx) {
    return NextResponse.json({ error: 'No workspace found' }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));
  const action = searchParams.get('action');
  const resource = searchParams.get('resource');

  const where: Record<string, unknown> = { workspaceId: ctx.workspace.id };
  if (action) where.action = action;
  if (resource) where.resource = resource;

  const [logs, total] = await Promise.all([
    db.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.auditLog.count({ where }),
  ]);

  // Get user names
  const userIds = logs.map((l) => l.userId).filter(Boolean) as string[];
  const users = await db.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true },
  });
  const userMap = new Map(users.map((u) => [u.id, u]));

  const entries = logs.map((log) => {
    const user = log.userId ? userMap.get(log.userId) : null;
    const detail = log.detail as Record<string, unknown> | null;
    return {
      id: log.id,
      action: log.action,
      resource: log.resource,
      resourceId: log.resourceId,
      detail: detail,
      user: user?.name ?? user?.email ?? '系统',
      createdAt: log.createdAt.toISOString(),
    };
  });

  return NextResponse.json({
    logs: entries,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
