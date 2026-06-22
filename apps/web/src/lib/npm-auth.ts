import { db } from '@/lib/db';
import { sha256 } from '@/lib/crypto';

/**
 * npm Registry Auth Middleware
 *
 * npm CLI sends auth via:
 * - Authorization: Bearer <token>  (npm login / .npmrc _authToken)
 * - Authorization: Basic <base64(username:password)>  (legacy .npmrc _auth)
 *
 * We accept both. The token/password is an API Key (cop_xxx).
 * Returns { userId, workspaceId, apiKeyId } or null.
 */
export interface NpmAuthResult {
  userId: string;
  workspaceId: string;
  apiKeyId: string;
}

export async function authenticateNpmRequest(
  request: Request
): Promise<NpmAuthResult | null> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return null;

  // Bearer token (npm config set registry + _authToken)
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    return resolveApiKey(token);
  }

  // Basic auth (legacy: _auth = base64(username:password))
  if (authHeader.startsWith('Basic ')) {
    const encoded = authHeader.slice(6).trim();
    try {
      const decoded = Buffer.from(encoded, 'base64').toString('utf-8');
      // username:password — password is the API key
      const colonIndex = decoded.lastIndexOf(':');
      if (colonIndex === -1) return null;
      const password = decoded.slice(colonIndex + 1);
      return resolveApiKey(password);
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * Resolve an API key to a user + workspace.
 * Supports both `cop_` prefixed keys (new format) and bare tokens.
 */
async function resolveApiKey(token: string): Promise<NpmAuthResult | null> {
  if (!token) return null;

  const hashedKey = sha256(token);

  const apiKey = await db.apiKey.findFirst({
    where: {
      key: hashedKey,
      revokedAt: null,
    },
    include: {
      user: {
        include: {
          members: {
            include: { workspace: true },
          },
        },
      },
    },
  });

  if (!apiKey) return null;

  // Use the user's first workspace (could be enhanced to support workspace selection)
  const firstMember = apiKey.user.members[0];
  if (!firstMember) return null;

  // Fire-and-forget: update lastUsedAt
  db.apiKey
    .update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() },
    })
    .catch(() => {});

  return {
    userId: apiKey.userId,
    workspaceId: firstMember.workspaceId,
    apiKeyId: apiKey.id,
  };
}
