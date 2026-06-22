import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { getWorkspace } from '@/lib/workspace';
import { triggerWebhooks } from '@/lib/webhook';
import type { Prisma } from '@prisma/client';

const rollbackSchema = z.object({
  targetVersion: z.number().int().positive(),
});

/**
 * POST /api/configs/[id]/rollback
 * Rollback a config to a previous snapshot version.
 *
 * Flow:
 * 1. Read ConfigSnapshot at targetVersion
 * 2. Create new ConfigSnapshot (next version = target's value)
 * 3. Update Config's current value
 * 4. Write audit log (action: ROLLBACK)
 * 5. Trigger Webhook (event: config.rollback)
 */
export async function POST(
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

  // Only ADMIN and DEVELOPER can rollback
  if (ctx.role === 'VIEWER') {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = rollbackSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { targetVersion } = parsed.data;

  // Find the config
  const config = await db.config.findFirst({
    where: { id, workspaceId: ctx.workspace.id },
  });

  if (!config) {
    return NextResponse.json({ error: 'Config not found' }, { status: 404 });
  }

  // Find the target snapshot
  const targetSnapshot = await db.configSnapshot.findFirst({
    where: { configId: config.id, version: targetVersion },
  });

  if (!targetSnapshot) {
    return NextResponse.json(
      { error: `Version ${targetVersion} not found` },
      { status: 404 }
    );
  }

  // Don't rollback to current value
  if (targetSnapshot.value === config.value) {
    return NextResponse.json(
      { error: '目标版本与当前值相同，无需回滚' },
      { status: 400 }
    );
  }

  // Get next version number
  const lastSnapshot = await db.configSnapshot.findFirst({
    where: { configId: config.id },
    orderBy: { version: 'desc' },
  });
  const nextVersion = (lastSnapshot?.version ?? 0) + 1;

  const oldValue = config.value;
  const rollbackValue = targetSnapshot.value;

  // Perform rollback in transaction
  const updated = await db.$transaction(async (tx) => {
    // Update config's current value
    const updated = await tx.config.update({
      where: { id: config.id },
      data: { value: rollbackValue },
      include: {
        _count: { select: { snapshots: true } },
      },
    });

    // Create new snapshot (rollback creates a new version, doesn't overwrite history)
    await tx.configSnapshot.create({
      data: {
        configId: config.id,
        version: nextVersion,
        value: rollbackValue,
        changedBy: session.user.id,
        changeType: 'UPDATED',
      },
    });

    // Write audit log
    await tx.auditLog.create({
      data: {
        workspaceId: ctx.workspace.id,
        userId: session.user.id,
        action: 'ROLLBACK',
        resource: 'config',
        resourceId: config.id,
        detail: {
          key: config.key,
          environment: config.environment,
          oldValue,
          newValue: rollbackValue,
          rolledBackTo: targetVersion,
          newVersion: nextVersion,
        } as Prisma.InputJsonValue,
      },
    });

    return updated;
  });

  // Trigger webhooks (fire-and-forget)
  triggerWebhooks({
    workspaceId: ctx.workspace.id,
    event: 'config.updated',
    data: {
      key: config.key,
      environment: config.environment,
      oldValue,
      newValue: rollbackValue,
      version: nextVersion,
      rolledBackTo: targetVersion,
    },
  }).catch(() => {});

  return NextResponse.json({
    config: updated,
    rollback: {
      fromVersion: lastSnapshot?.version ?? 0,
      toVersion: targetVersion,
      newVersion: nextVersion,
      oldValue,
      newValue: rollbackValue,
    },
  });
}
