import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getWorkspace } from '@/lib/workspace';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

/**
 * POST /api/billing/portal
 * Creates a Stripe Customer Portal session for managing subscription.
 *
 * If Stripe is not configured, returns a dev-mode response.
 */
export async function POST() {
  const ctx = await getWorkspace();
  if (!ctx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { workspace } = ctx;

  const subscription = await db.subscription.findFirst({
    where: { workspaceId: workspace.id },
  });

  if (!subscription?.stripeCustomerId) {
    return NextResponse.json({
      error: 'No active Stripe subscription found. You are on the free plan or in dev mode.',
    }, { status: 400 });
  }

  if (!STRIPE_SECRET_KEY) {
    // Dev mode: simulate downgrade to FREE
    await db.workspace.update({
      where: { id: workspace.id },
      data: { plan: 'FREE' },
    });
    await db.subscription.update({
      where: { id: subscription.id },
      data: {
        plan: 'FREE',
        status: 'CANCELED',
        cancelAtPeriodEnd: false,
      },
    });

    return NextResponse.json({
      url: null,
      devMode: true,
      message: '开发模式：已降级到免费版。配置 Stripe 密钥后将跳转到真实管理页面。',
    });
  }

  const Stripe = (await import('stripe')).default;
  const stripe = new Stripe(STRIPE_SECRET_KEY);

  const session = await stripe.billingPortal.sessions.create({
    customer: subscription.stripeCustomerId,
    return_url: `${process.env.NEXTAUTH_URL}/settings`,
  });

  return NextResponse.json({ url: session.url });
}
