import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import type { Workspace, Member, Role } from '@prisma/client';

export interface WorkspaceContext {
  workspace: Workspace;
  member: Member;
  role: Role;
}

/**
 * Get the current user's workspace context from session.
 * Each user belongs to at least one workspace (created on registration).
 * For now, we use the first workspace the user is a member of.
 */
export async function getWorkspace(): Promise<WorkspaceContext | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const member = await db.member.findFirst({
    where: { userId: session.user.id },
    include: { workspace: true },
    orderBy: { createdAt: 'asc' },
  });

  if (!member) return null;

  return {
    workspace: member.workspace,
    member,
    role: member.role,
  };
}

/**
 * Get workspace ID for use in API routes.
 * Throws if no session or workspace found.
 */
export async function requireWorkspace(): Promise<WorkspaceContext> {
  const ctx = await getWorkspace();
  if (!ctx) {
    throw new Response('Unauthorized', { status: 401 });
  }
  return ctx;
}

/**
 * Check if the current user has permission for an action.
 */
export function hasPermission(role: Role, allowed: Role[]): boolean {
  return allowed.includes(role);
}
