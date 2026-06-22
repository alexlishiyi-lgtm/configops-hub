import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getWorkspace } from '@/lib/workspace';
import { PLAN_LIMITS } from '@/lib/plan-limits';
import { formatStorage } from '@/lib/plan-limits';

/**
 * GET /api/billing/subscription
 * Returns the current workspace's subscription status + usage stats.
 */
export async function GET() {
  const ctx = await getWorkspace();
  if (!ctx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { workspace } = ctx;
  const plan = workspace.plan;
  const limits = PLAN_LIMITS[plan];

  // Get current usage
  const [configCount, memberCount, packageCount, packageAgg] = await Promise.all([
    db.config.count({ where: { workspaceId: workspace.id } }),
    db.member.count({ where: { workspaceId: workspace.id } }),
    db.package.count({ where: { workspaceId: workspace.id } }),
    db.package.aggregate({
      where: { workspaceId: workspace.id },
      _sum: { size: true },
    }),
  ]);

  const storageUsed = packageAgg._sum.size || 0;

  // Get subscription record if exists
  const subscription = await db.subscription.findFirst({
    where: { workspaceId: workspace.id },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({
    plan,
    planLabel: limits.label,
    price: limits.price,
    limits: {
      maxConfigs: limits.maxConfigs,
      maxMembers: limits.maxMembers,
      maxPackages: limits.maxPackages,
      maxStorage: limits.maxStorage,
      maxStorageLabel: limits.maxStorage ? formatStorage(limits.maxStorage) : '无限',
      webhooksEnabled: limits.webhooksEnabled,
      rollbackEnabled: limits.rollbackEnabled,
      npmRegistry: limits.npmRegistry,
    },
    usage: {
      configCount,
      memberCount,
      packageCount,
      storageUsed,
      storageUsedLabel: formatStorage(storageUsed),
    },
    subscription: subscription
      ? {
          status: subscription.status,
          currentPeriodEnd: subscription.currentPeriodEnd,
          cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
          stripeCustomerId: subscription.stripeCustomerId,
        }
      : null,
    features: limits.features,
  });
}
