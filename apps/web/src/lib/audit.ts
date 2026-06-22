import { db } from '@/lib/db';
import type { AuditAction, Prisma } from '@prisma/client';

interface AuditParams {
  workspaceId: string;
  userId?: string;
  action: AuditAction;
  resource: string;
  resourceId?: string;
  detail?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Create an audit log entry.
 * Called after every config/package/member mutation.
 */
export async function createAuditLog(params: AuditParams) {
  return db.auditLog.create({
    data: {
      workspaceId: params.workspaceId,
      userId: params.userId ?? null,
      action: params.action,
      resource: params.resource,
      resourceId: params.resourceId ?? null,
      detail: (params.detail ?? undefined) as Prisma.InputJsonValue | undefined,
      ipAddress: params.ipAddress ?? null,
      userAgent: params.userAgent ?? null,
    },
  });
}
