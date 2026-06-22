import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateNpmRequest } from '@/lib/npm-auth';

/**
 * npm Registry catch-all route
 *
 * Handles:
 * - GET /npm/-/ping          → health check
 * - GET /npm/:packageName    → package metadata (npm install)
 * - GET /npm/-/ping          → ping
 * - GET /npm/-/user/org.couchdb.user:username → whoami
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ npm: string[] }> }
) {
  const segments = (await params).npm;

  // Health check
  if (segments.length === 2 && segments[0] === '-' && segments[1] === 'ping') {
    return NextResponse.json({ ok: true });
  }

  // Whoami (npm whoami) — /-/user/org.couchdb.user:username
  if (segments.length === 3 && segments[0] === '-' && segments[1] === 'user' && segments[2].startsWith('org.couchdb.user:')) {
    const auth = await authenticateNpmRequest(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const user = await db.user.findUnique({
      where: { id: auth.userId },
      select: { name: true, email: true },
    });
    return NextResponse.json({
      username: user?.name || user?.email || 'unknown',
    });
  }

  // npm login (PUT /-/user/org.couchdb.user:username) — handled by PUT below

  // Package metadata
  // Reconstruct the package name from URL segments
  // For scoped packages like @org/utils, npm sends: /npm/@org/utils (two segments)
  // Or URL-encoded: /npm/%40org%2Futils (one segment after decode)
  const packageName = decodeURIComponent(segments.join('/'));

  // Try to authenticate (optional — public packages don't require auth)
  const auth = await authenticateNpmRequest(request);

  // 1. Check private packages in database
  let workspaceId = auth?.workspaceId;

  // If no auth, try to find the package in any workspace (public proxy mode)
  if (!workspaceId) {
    // For unauthenticated requests, check if any workspace has this as a private package
    const privatePkg = await db.package.findFirst({
      where: { name: packageName, scope: 'NPM', isPrivate: true },
    });

    if (privatePkg) {
      // Private package requires auth
      return NextResponse.json(
        { error: 'Authentication required for private package' },
        { status: 401 }
      );
    }
  }

  if (workspaceId) {
    const localPkg = await db.package.findUnique({
      where: {
        workspaceId_scope_name: {
          workspaceId,
          scope: 'NPM',
          name: packageName,
        },
      },
    });

    if (localPkg) {
      // Build npm registry metadata response
      const meta = buildPackageMetadata(localPkg);
      return NextResponse.json(meta);
    }
  }

  // 2. Proxy to npmjs.org for public packages
  try {
    const upstreamUrl = `https://registry.npmjs.org/${encodeURIComponent(packageName).replace(/%2F/g, '/')}`;
    const upstreamRes = await fetch(upstreamUrl);

    if (!upstreamRes.ok) {
      if (upstreamRes.status === 404) {
        return NextResponse.json(
          { error: `Package not found: ${packageName}` },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: `Upstream error: ${upstreamRes.status}` },
        { status: upstreamRes.status }
      );
    }

    const meta = await upstreamRes.json();

    // Rewrite tarball URLs to point through our proxy
    // (so downloads go through ConfigOps for caching/analytics)
    if (meta.versions) {
      for (const ver of Object.keys(meta.versions)) {
        const v = meta.versions[ver];
        if (v.dist?.tarball) {
          // Keep original tarball URL for now (proxy download not implemented yet)
          // In production: rewrite to /npm/:packageName/-/:tarball
        }
      }
    }

    return NextResponse.json(meta);
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch from upstream registry' },
      { status: 502 }
    );
  }
}

/**
 * PUT /api/npm/-/user/org.couchdb.user:username
 * npm login — validate API key and return user info
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ npm: string[] }> }
) {
  const segments = (await params).npm;

  // npm login: /-/user/org.couchdb.user:username
  if (segments.length === 3 && segments[0] === '-' && segments[1] === 'user' && segments[2].startsWith('org.couchdb.user:')) {
    const body = await request.json();
    // npm login sends { name, password, email, type }
    // password = API key (cop_xxx)
    const token = body.password;
    if (!token) {
      return NextResponse.json({ error: 'Password (API Key) required' }, { status: 400 });
    }

    const auth = await authenticateNpmRequest(
      new Request(request.url, {
        headers: new Headers({
          authorization: `Bearer ${token}`,
        }),
      })
    );

    if (!auth) {
      return NextResponse.json({ error: 'Invalid API Key' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: auth.userId },
      select: { name: true, email: true },
    });

    return NextResponse.json({
      ok: true,
      id: `org.couchdb.user:${user?.name || user?.email}`,
      name: user?.name || user?.email,
      email: user?.email,
      roles: [],
    });
  }

  // npm publish: PUT /api/npm/:packageName
  // Forward to the base route handler by re-importing
  return NextResponse.json({ error: 'Use PUT /api/npm for publish' }, { status: 400 });
}

/**
 * Build npm registry-compatible metadata for a private package.
 */
function buildPackageMetadata(pkg: {
  id: string;
  name: string;
  version: string;
  description?: string | null;
  tarballUrl?: string | null;
  size: number;
  downloadCount: number;
  updatedAt: Date;
}) {
  const tarballUrl = pkg.tarballUrl || `/npm/${encodeURIComponent(pkg.name)}/-/${pkg.name}-${pkg.version}.tgz`;

  return {
    _id: pkg.name,
    name: pkg.name,
    description: pkg.description || '',
    'dist-tags': {
      latest: pkg.version,
    },
    versions: {
      [pkg.version]: {
        name: pkg.name,
        version: pkg.version,
        description: pkg.description || '',
        dist: {
          tarball: tarballUrl,
          // shasum would be computed from the actual tarball
          unpackedSize: pkg.size,
        },
        _npmUser: { name: 'ConfigOps Hub' },
      },
    },
    time: {
      [pkg.version]: pkg.updatedAt.toISOString(),
      modified: pkg.updatedAt.toISOString(),
    },
    _rev: `1-${pkg.id.slice(-8)}`,
  };
}
