import type { Plan } from '@prisma/client';

/**
 * Plan limits configuration.
 * Used by API routes to enforce usage limits per subscription tier.
 */
export const PLAN_LIMITS: Record<Plan, {
  maxConfigs: number | null; // null = unlimited
  maxPackages: number | null;
  maxMembers: number | null;
  maxStorage: number | null; // in bytes
  webhooksEnabled: boolean;
  rollbackEnabled: boolean;
  npmRegistry: boolean;
  label: string;
  price: number;
  features: string[];
}> = {
  FREE: {
    maxConfigs: 100,
    maxPackages: 10,
    maxMembers: 1,
    maxStorage: 1 * 1024 * 1024 * 1024, // 1GB
    webhooksEnabled: false,
    rollbackEnabled: false,
    npmRegistry: false,
    label: '免费版',
    price: 0,
    features: ['100 条配置项', '1GB 包存储', '1 个成员', '基础 SDK 拉取', '社区支持'],
  },
  PRO: {
    maxConfigs: null,
    maxPackages: null,
    maxMembers: 10,
    maxStorage: 10 * 1024 * 1024 * 1024, // 10GB
    webhooksEnabled: true,
    rollbackEnabled: true,
    npmRegistry: true,
    label: '专业版',
    price: 59,
    features: ['无限配置项', '10GB 包存储', '10 个成员', 'Webhook 通知', '版本回滚', 'npm Registry', '邮件支持'],
  },
  TEAM: {
    maxConfigs: null,
    maxPackages: null,
    maxMembers: null,
    maxStorage: 50 * 1024 * 1024 * 1024, // 50GB
    webhooksEnabled: true,
    rollbackEnabled: true,
    npmRegistry: true,
    label: '团队版',
    price: 199,
    features: ['无限配置项', '50GB 包存储', '无限成员', 'Webhook + 审计导出', '版本回滚', 'npm Registry', '优先支持'],
  },
};

/**
 * Check if a feature is available for the current plan.
 */
export function isFeatureAvailable(plan: Plan, feature: 'webhooks' | 'rollback' | 'npmRegistry'): boolean {
  const limits = PLAN_LIMITS[plan];
  switch (feature) {
    case 'webhooks':
      return limits.webhooksEnabled;
    case 'rollback':
      return limits.rollbackEnabled;
    case 'npmRegistry':
      return limits.npmRegistry;
    default:
      return false;
  }
}

/**
 * Check config count limit.
 * Returns { allowed: boolean, current: number, max: number | null }
 */
export async function checkConfigLimit(workspaceId: string, plan: Plan, db: any) {
  const limits = PLAN_LIMITS[plan];
  if (limits.maxConfigs === null) return { allowed: true, current: 0, max: null };

  const current = await db.config.count({ where: { workspaceId } });
  return {
    allowed: current < limits.maxConfigs,
    current,
    max: limits.maxConfigs,
  };
}

/**
 * Check member count limit.
 */
export async function checkMemberLimit(workspaceId: string, plan: Plan, db: any) {
  const limits = PLAN_LIMITS[plan];
  if (limits.maxMembers === null) return { allowed: true, current: 0, max: null };

  const current = await db.member.count({ where: { workspaceId } });
  return {
    allowed: current < limits.maxMembers,
    current,
    max: limits.maxMembers,
  };
}

/**
 * Check package count limit.
 */
export async function checkPackageLimit(workspaceId: string, plan: Plan, db: any) {
  const limits = PLAN_LIMITS[plan];
  if (limits.maxPackages === null) return { allowed: true, current: 0, max: null };

  const current = await db.package.count({ where: { workspaceId } });
  return {
    allowed: current < limits.maxPackages,
    current,
    max: limits.maxPackages,
  };
}

/**
 * Format bytes to human readable string.
 */
export function formatStorage(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}
