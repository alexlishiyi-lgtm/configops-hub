import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { getWorkspace } from '@/lib/workspace';
import { triggerWebhooks } from '@/lib/webhook';
import type { PackageScope } from '@prisma/client';
import type { Prisma } from '@prisma/client';

const createPackageSchema = z.object({
  name: z.string().min(1).max(255).regex(/^[a-zA-Z0-9@_\-/.]+$/, '包名只能包含字母、数字、@、下划线、短横线、点、斜杠'),
  scope: z.enum(['NPM', 'PIP']).default('NPM'),
  version: z.string().min(1).max(100).regex(/^\d+\.\d+\.\d+/, '版本号格式应为 x.y.z'),
  description: z.string().max(500).optional().nullable(),
  isPrivate: z.boolean().default(true),
  size: z.number().int().min(0).default(0),
  tarballUrl: z.string().url().optional().nullable(),
});

/**
 * GET /api/packages?scope=NPM&search=keyword
 * List packages for the current workspace.
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
  const scope = searchParams.get('scope');
  const search = searchParams.get('search');

  const where: Prisma.PackageWhereInput = { workspaceId: ctx.workspace.id };
  if (scope && scope !== 'ALL') {
    where.scope = scope as PackageScope;
  }
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  const packages = await db.package.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
  });

  return NextResponse.json({ packages });
}

/**
 * POST /api/packages
 * Publish a new package (or update version if exists).
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

  // Only ADMIN and DEVELOPER can publish packages
  if (ctx.role === 'VIEWER') {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  const body = await request.json();
  const parsed = createPackageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { name, scope, version, description, isPrivate, size, tarballUrl } = parsed.data;

  // Check for duplicate (workspaceId + scope + name)
  const existing = await db.package.findUnique({
    where: {
      workspaceId_scope_name: {
        workspaceId: ctx.workspace.id,
        scope,
        name,
      },
    },
  });

  if (existing) {
    // Update existing package version
    const updated = await db.$transaction(async (tx) => {
      const pkg = await tx.package.update({
        where: { id: existing.id },
        data: {
          version,
          description: description ?? null,
          isPrivate,
          size,
          tarballUrl: tarballUrl ?? null,
        },
      });

      await tx.auditLog.create({
        data: {
          workspaceId: ctx.workspace.id,
          userId: session.user.id,
          action: 'UPDATE',
          resource: 'package',
          resourceId: pkg.id,
          detail: { name, scope, version, oldVersion: existing.version } as Prisma.InputJsonValue,
        },
      });

      return pkg;
    });

    triggerWebhooks({
      workspaceId: ctx.workspace.id,
      event: 'package.published',
      data: { name, scope, version, packageId: updated.id, action: 'update' },
    }).catch(() => {});

    return NextResponse.json({ package: updated });
  }

  // Create new package
  const pkg = await db.$transaction(async (tx) => {
    const pkg = await tx.package.create({
      data: {
        workspaceId: ctx.workspace.id,
        name,
        scope,
        version,
        description: description ?? null,
        isPrivate,
        size,
        tarballUrl: tarballUrl ?? null,
      },
    });

    await tx.auditLog.create({
      data: {
        workspaceId: ctx.workspace.id,
        userId: session.user.id,
        action: 'CREATE',
        resource: 'package',
        resourceId: pkg.id,
        detail: { name, scope, version, isPrivate } as Prisma.InputJsonValue,
      },
    });

    return pkg;
  });

  triggerWebhooks({
    workspaceId: ctx.workspace.id,
    event: 'package.published',
    data: { name, scope, version, packageId: pkg.id, action: 'create' },
  }).catch(() => {});

  return NextResponse.json({ package: pkg }, { status: 201 });
}
