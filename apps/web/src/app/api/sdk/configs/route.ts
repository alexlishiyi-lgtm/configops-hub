import { NextRequest, NextResponse } from 'next/server';
import { Environment } from '@prisma/client';
import { db } from '@/lib/db';
import { sha256 } from '@/lib/crypto';

/**
 * GET /api/sdk/configs?env=DEV
 *
 * SDK 拉取端点 — 高性能配置读取，供 Node/Python SDK 调用。
 *
 * 认证: Bearer token (API Key)
 * 缓存: ETag + If-None-Match → 304 Not Modified
 *
 * 响应:
 *   200 — { configs: { key: value, ... }, etag: "xxx", timestamp: "xxx" }
 *   304 — (空 body，配置未变更)
 *   401 — API Key 无效
 *   403 — API Key 已吊销
 */
export async function GET(request: NextRequest) {
  // 1. 验证 API Key
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Missing or invalid Authorization header' }, { status: 401 });
  }

  const rawKey = authHeader.replace('Bearer ', '').trim();
  if (!rawKey.startsWith('cop_')) {
    return NextResponse.json({ error: 'Invalid API key format' }, { status: 401 });
  }

  // Hash the key to look up in DB
  const keyHash = sha256(rawKey);

  const apiKey = await db.apiKey.findUnique({
    where: { key: keyHash },
    include: {
      user: {
        include: {
          members: {
            select: { workspaceId: true, role: true },
          },
        },
      },
    },
  });

  if (!apiKey) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
  }

  if (apiKey.revokedAt) {
    return NextResponse.json({ error: 'API key has been revoked' }, { status: 403 });
  }

  // Get the workspace (first workspace the user is a member of)
  const membership = apiKey.user.members[0];
  if (!membership) {
    return NextResponse.json({ error: 'No workspace associated with this API key' }, { status: 403 });
  }

  const workspaceId = membership.workspaceId;

  // 2. Parse environment
  const { searchParams } = new URL(request.url);
  const envStr = (searchParams.get('env') || 'DEV').toUpperCase();
  if (!['DEV', 'TEST', 'PROD'].includes(envStr)) {
    return NextResponse.json({ error: 'Invalid environment. Use DEV, TEST, or PROD.' }, { status: 400 });
  }
  const env = envStr as Environment;

  // 3. Fetch configs
  const configs = await db.config.findMany({
    where: { workspaceId, environment: env },
    select: { key: true, value: true, type: true, updatedAt: true },
  });

  // 4. Build response — transform to { key: value } map
  const configMap: Record<string, string> = {};
  let latestUpdate = new Date(0);

  for (const c of configs) {
    configMap[c.key] = c.value;
    if (c.updatedAt > latestUpdate) {
      latestUpdate = c.updatedAt;
    }
  }

  // 5. ETag calculation — hash of all config keys+values+latest update time
  const etag = sha256(`${workspaceId}:${env}:${latestUpdate.getTime()}:${configs.length}`);

  // 6. Check If-None-Match
  const ifNoneMatch = request.headers.get('if-none-match');
  if (ifNoneMatch === etag) {
    return new NextResponse(null, {
      status: 304,
      headers: {
        ETag: etag,
        'Cache-Control': 'no-cache',
      },
    });
  }

  // 7. Update lastUsedAt (fire and forget)
  db.apiKey.update({
    where: { id: apiKey.id },
    data: { lastUsedAt: new Date() },
  }).catch(() => {});

  return NextResponse.json(
    {
      configs: configMap,
      environment: env,
      count: configs.length,
      etag,
      timestamp: new Date().toISOString(),
    },
    {
      headers: {
        ETag: etag,
        'Cache-Control': 'no-cache',
      },
    }
  );
}
