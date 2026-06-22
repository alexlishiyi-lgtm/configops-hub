import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { getWorkspace } from '@/lib/workspace';

const updateConfigSchema = z.object({
  value: z.string().min(0).optional(),
  description: z.string().max(500).optional().nullable(),
});

/**
 * GET /api/configs/[id]
 * Get a single config with its recent snapshots.
 */
export async function GET(
  request: NextRequest,
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

  const config = await db.config.findFirst({
    where: { id, workspaceId: ctx.workspace.id },
    include: {
      snapshots: {
        orderBy: { version: 'desc' },
        take: 10,
        include: {
          // We can't easily include user relation here without changing schema,
          // but we have changedBy userId for reference
        },
      },
    },
  });

  if (!config) {
    return NextResponse.json({ error: 'Config not found' }, { status: 404 });
  }

  return NextResponse.json({ config });
}

/**
 * PUT /api/configs/[id]
 * Update a config value. Creates a new snapshot + audit log.
 */
export async function PUT(
  request: NextRequest,
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

  if (ctx.role === 'VIEWER') {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = updateConfigSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const config = await db.config.findFirst({
    where: { id, workspaceId: ctx.workspace.id },
  });

  if (!config) {
    return NextResponse.json({ error: 'Config not found' }, { status: 404 });
  }

  const { value: newValue, description } = parsed.data;

  // If updating value, validate type and create snapshot
  if (newValue !== undefined && newValue !== config.value) {
    const typeError = validateValueType(newValue, config.type);
    if (typeError) {
      return NextResponse.json({ error: typeError }, { status: 400 });
    }

    // Get next version number
    const lastSnapshot = await db.configSnapshot.findFirst({
      where: { configId: config.id },
      orderBy: { version: 'desc' },
    });
    const nextVersion = (lastSnapshot?.version ?? 0) + 1;

    const updated = await db.$transaction(async (tx) => {
      const updated = await tx.config.update({
        where: { id: config.id },
        data: {
          value: newValue,
          ...(description !== undefined ? { description: description ?? null } : {}),
        },
        include: {
          _count: { select: { snapshots: true } },
        },
      });

      await tx.configSnapshot.create({
        data: {
          configId: config.id,
          version: nextVersion,
          value: newValue,
          changedBy: session.user.id,
          changeType: 'UPDATED',
        },
      });

      await tx.auditLog.create({
        data: {
          workspaceId: ctx.workspace.id,
          userId: session.user.id,
          action: 'UPDATE',
          resource: 'config',
          resourceId: config.id,
          detail: {
            key: config.key,
            environment: config.environment,
            oldValue: config.value,
            newValue,
            version: nextVersion,
          },
        },
      });

      return updated;
    });

    return NextResponse.json({ config: updated });
  }

  // Only updating description
  if (description !== undefined) {
    const updated = await db.config.update({
      where: { id: config.id },
      data: { description: description ?? null },
      include: {
        _count: { select: { snapshots: true } },
      },
    });

    return NextResponse.json({ config: updated });
  }

  return NextResponse.json({ config });
}

/**
 * DELETE /api/configs/[id]
 * Delete a config. Creates a snapshot with DELETED type + audit log.
 */
export async function DELETE(
  request: NextRequest,
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

  if (ctx.role === 'VIEWER') {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  const { id } = await params;

  const config = await db.config.findFirst({
    where: { id, workspaceId: ctx.workspace.id },
  });

  if (!config) {
    return NextResponse.json({ error: 'Config not found' }, { status: 404 });
  }

  await db.$transaction(async (tx) => {
    // Record the deletion in the audit log (snapshots are cascade-deleted with the config,
    // but the audit log entry on the workspace survives and retains the key/environment info)
    await tx.auditLog.create({
      data: {
        workspaceId: ctx.workspace.id,
        userId: session.user.id,
        action: 'DELETE',
        resource: 'config',
        resourceId: config.id,
        detail: { key: config.key, environment: config.environment, lastValue: config.value },
      },
    });

    // Delete the config (cascades to snapshots)
    await tx.config.delete({
      where: { id: config.id },
    });
  });

  return NextResponse.json({ success: true });
}

function validateValueType(value: string, type: string): string | null {
  switch (type) {
    case 'NUMBER':
      if (isNaN(Number(value))) return '值必须是有效数字';
      return null;
    case 'BOOLEAN':
      if (!['true', 'false'].includes(value.toLowerCase())) return '布尔值只能是 true 或 false';
      return null;
    case 'JSON':
      try {
        JSON.parse(value);
        return null;
      } catch {
        return '值必须是有效的 JSON';
      }
    default:
      return null;
  }
}
