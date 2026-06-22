import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateNpmRequest } from '@/lib/npm-auth';
import type { Prisma } from '@prisma/client';

/**
 * PUT /api/npm
 * npm publish — publish a package tarball
 *
 * npm CLI sends PUT to the registry root with the package body.
 */
export async function PUT(request: NextRequest) {
  const auth = await authenticateNpmRequest(request);
  if (!auth) {
    return NextResponse.json(
      { error: 'Unauthorized — run npm login first' },
      { status: 401 }
    );
  }

  const body = await request.json();

  const packageName = body.name;
  if (!packageName) {
    return NextResponse.json({ error: 'Package name required' }, { status: 400 });
  }

  const versions = Object.keys(body.versions || {});
  if (versions.length === 0) {
    return NextResponse.json({ error: 'No version provided' }, { status: 400 });
  }

  const version = versions[0];
  const versionData = body.versions[version];

  // Extract tarball data from _attachments
  const attachments = body._attachments || {};
  const attachmentKey = Object.keys(attachments)[0];
  const tarballData = attachmentKey ? attachments[attachmentKey]?.data : null;
  const tarballSize = tarballData ? Buffer.byteLength(tarballData, 'base64') : 0;

  // Store tarball reference (in production: upload to OSS)
  const tarballUrl = tarballData ? `npm://${packageName}/${version}.tgz` : null;

  // Check for existing package
  const existing = await db.package.findUnique({
    where: {
      workspaceId_scope_name: {
        workspaceId: auth.workspaceId,
        scope: 'NPM',
        name: packageName,
      },
    },
  });

  if (existing) {
    const updated = await db.package.update({
      where: { id: existing.id },
      data: {
        version,
        description: versionData.description || existing.description,
        size: tarballSize || existing.size,
        tarballUrl: tarballUrl || existing.tarballUrl,
      },
    });

    await db.auditLog.create({
      data: {
        workspaceId: auth.workspaceId,
        userId: auth.userId,
        action: 'UPDATE',
        resource: 'package',
        resourceId: updated.id,
        detail: { name: packageName, version, scope: 'NPM', source: 'npm-publish' } as Prisma.InputJsonValue,
      },
    });

    return NextResponse.json({ ok: true, package: updated });
  }

  const pkg = await db.package.create({
    data: {
      workspaceId: auth.workspaceId,
      name: packageName,
      scope: 'NPM',
      version,
      description: versionData.description || null,
      size: tarballSize,
      isPrivate: true,
      tarballUrl,
    },
  });

  await db.auditLog.create({
    data: {
      workspaceId: auth.workspaceId,
      userId: auth.userId,
      action: 'CREATE',
      resource: 'package',
      resourceId: pkg.id,
      detail: { name: packageName, version, scope: 'NPM', source: 'npm-publish' } as Prisma.InputJsonValue,
    },
  });

  return NextResponse.json({ ok: true, package: pkg }, { status: 201 });
}
