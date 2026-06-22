import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { getWorkspace } from '@/lib/workspace';
import { triggerWebhooks } from '@/lib/webhook';
import { checkConfigLimit, PLAN_LIMITS } from '@/lib/plan-limits';

const createConfigSchema = z.object({
  key: z.string().min(1).max(255).regex(/^[a-zA-Z0-9_.\-/]+$/, 'Key 只能包含字母、数字、点、下划线、短横线'),
  value: z.string().min(0),
  type: z.enum(['STRING', 'NUMBER', 'BOOLEAN', 'JSON']).default('STRING'),
  environment: z.enum(['DEV', 'TEST', 'PROD']).default('DEV'),
  description: z.string().max(500).optional().nullable(),
});

/**
 * GET /api/configs?env=DEV&search=keyword
 * List configs for the current workspace, filtered by environment and search.
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
  const env = searchParams.get('env');
  const search = searchParams.get('search');

  const where: Record<string, unknown> = { workspaceId: ctx.workspace.id };
  if (env && env !== 'ALL') {
    where.environment = env;
  }
  if (search) {
    where.OR = [
      { key: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  const configs = await db.config.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
    include: {
      _count: { select: { snapshots: true } },
    },
  });

  return NextResponse.json({ configs });
}

/**
 * POST /api/configs
 * Create a new config item. Creates an initial snapshot + audit log.
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const ctx = await getWorkspace();
  if (!ctx) {
    return NextResponse.json({ error: 'No workspace found' }, { status: 404 });
  }

  // Only ADMIN and DEVELOPER can create configs
  if (ctx.role === 'VIEWER') {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  const body = await request.json();
  const parsed = createConfigSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { key, value, type, environment, description } = parsed.data;

  // Check plan limits
  const limitCheck = await checkConfigLimit(ctx.workspace.id, ctx.workspace.plan, db);
  if (!limitCheck.allowed) {
    return NextResponse.json({
      error: `已达到 ${PLAN_LIMITS[ctx.workspace.plan].label} 配置项上限 (${limitCheck.max} 条)，请升级计划`,
    }, { status: 402 });
  }

  // Check for duplicate key+env
  const existing = await db.config.findUnique({
    where: {
      workspaceId_key_environment: {
        workspaceId: ctx.workspace.id,
        key,
        environment,
      },
    },
  });

  if (existing) {
    return NextResponse.json(
      { error: `配置项 "${key}" 在 ${environment} 环境已存在` },
      { status: 409 }
    );
  }

  // Validate value matches type
  const typeError = validateValueType(value, type);
  if (typeError) {
    return NextResponse.json({ error: typeError }, { status: 400 });
  }

  // Create config + initial snapshot + audit log in a transaction
  const config = await db.$transaction(async (tx) => {
    const config = await tx.config.create({
      data: {
        workspaceId: ctx.workspace.id,
        key,
        value,
        type,
        environment,
        description: description ?? null,
        snapshots: {
          create: {
            version: 1,
            value,
            changedBy: session.user.id,
            changeType: 'CREATED',
          },
        },
      },
      include: {
        _count: { select: { snapshots: true } },
      },
    });

    await tx.auditLog.create({
      data: {
        workspaceId: ctx.workspace.id,
        userId: session.user.id,
        action: 'CREATE',
        resource: 'config',
        resourceId: config.id,
        detail: { key, environment, type, value },
      },
    });

    return config;
  });

  // Trigger webhooks (fire-and-forget)
  triggerWebhooks({
    workspaceId: ctx.workspace.id,
    event: 'config.created',
    data: { key, environment, type, value, configId: config.id },
  }).catch(() => {});

  return NextResponse.json({ config }, { status: 201 });
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
