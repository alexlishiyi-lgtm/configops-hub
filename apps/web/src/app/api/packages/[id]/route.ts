import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { getWorkspace } from '@/lib/workspace';
import { triggerWebhooks } from '@/lib/webhook';
import type { Prisma } from '@prisma/client';

/**
 * GET /api/packages/[id]
 * Get package detail.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const ctx = await getWorkspace();
  if (!ctx) {
    return NextResponse.json({ error: 'No workspace found' }, { status: 404 });
  }

  const { id } = await params;

  const pkg = await db.package.findFirst({
    where: { id, workspaceId: ctx.workspace.id },
  });

  if (!pkg) {
    return NextResponse.json({ error: 'Package not found' }, { status: 404 });
  }

  return NextResponse.json({ package: pkg });
}

/**
 * DELETE /api/packages/[id]
 * Delete a package.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const ctx = await getWorkspace();
  if (!ctx) {
    return NextResponse.json({ error: 'No workspace found' }, { status: 404 });
  }

  // Only ADMIN and DEVELOPER can delete packages
  if (ctx.role === 'VIEWER') {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  const { id } = await params;

  const pkg = await db.package.findFirst({
    where: { id, workspaceId: ctx.workspace.id },
  });

  if (!pkg) {
    return NextResponse.json({ error: 'Package not found' }, { status: 404 });
  }

  await db.$transaction(async (tx) => {
    await tx.package.delete({ where: { id } });

    await tx.auditLog.create({
      data: {
        workspaceId: ctx.workspace.id,
        userId: session.user.id,
        action: 'DELETE',
        resource: 'package',
        resourceId: id,
        detail: { name: pkg.name, scope: pkg.scope, version: pkg.version } as Prisma.InputJsonValue,
      },
    });
  });

  triggerWebhooks({
    workspaceId: ctx.workspace.id,
    event: 'package.published',
    data: { name: pkg.name, scope: pkg.scope, action: 'delete' },
  }).catch(() => {});

  return NextResponse.json({ success: true });
}
