import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { getWorkspace } from '@/lib/workspace';
import { generateApiKey } from '@/lib/crypto';

const createKeySchema = z.object({
  name: z.string().min(1).max(100),
});

/**
 * GET /api/api-keys
 * List API keys for the current user.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const keys = await db.apiKey.findMany({
    where: {
      userId: session.user.id,
      revokedAt: null,
    },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      lastUsedAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ keys });
}

/**
 * POST /api/api-keys
 * Create a new API key. Returns the raw key ONCE — it cannot be retrieved again.
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

  const body = await request.json();
  const parsed = createKeySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: '名称不能为空' }, { status: 400 });
  }

  const { rawKey, hashedKey, prefix } = generateApiKey();

  const apiKey = await db.apiKey.create({
    data: {
      userId: session.user.id,
      name: parsed.data.name,
      key: hashedKey,
      keyPrefix: prefix,
    },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      createdAt: true,
    },
  });

  // Return the raw key ONCE — client must save it
  return NextResponse.json(
    {
      key: apiKey,
      rawKey, // Only returned on creation
      warning: '请立即保存此密钥，关闭后将无法再次查看',
    },
    { status: 201 }
  );
}

/**
 * DELETE /api/api-keys?id=xxx
 * Revoke (soft-delete) an API key.
 */
export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  const key = await db.apiKey.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!key) {
    return NextResponse.json({ error: 'API key not found' }, { status: 404 });
  }

  await db.apiKey.update({
    where: { id },
    data: { revokedAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
