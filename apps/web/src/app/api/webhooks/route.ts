import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { getWorkspace } from '@/lib/workspace';
import { generateWebhookSecret } from '@/lib/crypto';
import { isFeatureAvailable, PLAN_LIMITS } from '@/lib/plan-limits';

const webhookEvents = [
  'config.created',
  'config.updated',
  'config.deleted',
  'package.published',
  'member.invited',
  'member.removed',
] as const;

const createWebhookSchema = z.object({
  url: z.string().url('请输入有效的 URL'),
  events: z.array(z.string()).min(1, '至少订阅一个事件'),
});

/**
 * GET /api/webhooks
 * List webhooks for the current workspace.
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

  const webhooks = await db.webhook.findMany({
    where: { workspaceId: ctx.workspace.id },
    select: {
      id: true,
      url: true,
      events: true,
      isActive: true,
      lastResponseCode: true,
      lastTriggeredAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ webhooks, availableEvents: webhookEvents });
}

/**
 * POST /api/webhooks
 * Create a new webhook.
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

  if (ctx.role === 'VIEWER') {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  // Check plan: webhooks require PRO or TEAM
  if (!isFeatureAvailable(ctx.workspace.plan, 'webhooks')) {
    return NextResponse.json({
      error: `${PLAN_LIMITS[ctx.workspace.plan].label} 不支持 Webhook 功能，请升级到专业版或团队版`,
    }, { status: 402 });
  }

  const body = await request.json();
  const parsed = createWebhookSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Validate events
  const invalidEvents = parsed.data.events.filter((e) => !webhookEvents.includes(e as typeof webhookEvents[number]));
  if (invalidEvents.length > 0) {
    return NextResponse.json(
      { error: `Invalid events: ${invalidEvents.join(', ')}` },
      { status: 400 }
    );
  }

  const secret = generateWebhookSecret();

  const webhook = await db.webhook.create({
    data: {
      workspaceId: ctx.workspace.id,
      url: parsed.data.url,
      events: parsed.data.events,
      secret,
    },
    select: {
      id: true,
      url: true,
      events: true,
      isActive: true,
      secret: true,
      createdAt: true,
    },
  });

  return NextResponse.json(
    {
      webhook,
      warning: '请保存 Webhook Secret，用于验证回调签名',
    },
    { status: 201 }
  );
}

/**
 * DELETE /api/webhooks?id=xxx
 */
export async function DELETE(request: NextRequest) {
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

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  const webhook = await db.webhook.findFirst({
    where: { id, workspaceId: ctx.workspace.id },
  });

  if (!webhook) {
    return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
  }

  await db.webhook.delete({ where: { id } });

  return NextResponse.json({ success: true });
}

/**
 * PATCH /api/webhooks?id=xxx
 * Toggle webhook active status.
 */
export async function PATCH(request: NextRequest) {
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

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  const body = await request.json();
  const { isActive } = body as { isActive: boolean };

  const webhook = await db.webhook.findFirst({
    where: { id, workspaceId: ctx.workspace.id },
  });

  if (!webhook) {
    return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
  }

  const updated = await db.webhook.update({
    where: { id },
    data: { isActive },
    select: {
      id: true,
      url: true,
      events: true,
      isActive: true,
    },
  });

  return NextResponse.json({ webhook: updated });
}
