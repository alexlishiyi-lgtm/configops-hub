import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getWorkspace } from '@/lib/workspace';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_PRICE_ID_PRO = process.env.STRIPE_PRICE_ID_PRO;
const STRIPE_PRICE_ID_TEAM = process.env.STRIPE_PRICE_ID_TEAM;

/**
 * POST /api/billing/checkout
 * Creates a Stripe Checkout Session for upgrading plan.
 * Body: { plan: 'PRO' | 'TEAM' }
 *
 * If Stripe is not configured (no secret key), returns a mock checkout URL
 * for development/testing purposes.
 */
export async function POST(request: NextRequest) {
  const ctx = await getWorkspace();
  if (!ctx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { workspace } = ctx;
  const body = await request.json();
  const { plan } = body;

  if (!['PRO', 'TEAM'].includes(plan)) {
    return NextResponse.json({ error: 'Invalid plan. Use PRO or TEAM.' }, { status: 400 });
  }

  const priceId = plan === 'PRO' ? STRIPE_PRICE_ID_PRO : STRIPE_PRICE_ID_TEAM;

  // If Stripe is not configured, return a dev-mode mock response
  if (!STRIPE_SECRET_KEY || !priceId) {
    // Simulate upgrade in dev mode
    await db.workspace.update({
      where: { id: workspace.id },
      data: { plan },
    });

    // Create or update subscription record
    const existingSub = await db.subscription.findFirst({
      where: { workspaceId: workspace.id },
    });
    if (existingSub) {
      await db.subscription.update({
        where: { id: existingSub.id },
        data: {
          plan,
          status: 'ACTIVE',
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });
    } else {
      await db.subscription.create({
        data: {
          workspaceId: workspace.id,
          plan,
          status: 'ACTIVE',
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });
    }

    return NextResponse.json({
      url: null,
      devMode: true,
      message: `开发模式：已直接升级到${plan === 'PRO' ? '专业版' : '团队版'}。配置 Stripe 密钥后将跳转到真实支付页面。`,
      plan,
    });
  }

  // Real Stripe checkout
  const Stripe = (await import('stripe')).default;
  const stripe = new Stripe(STRIPE_SECRET_KEY);

  // Get or create Stripe customer
  let subscription = await db.subscription.findFirst({
    where: { workspaceId: workspace.id },
  });

  let customerId = subscription?.stripeCustomerId;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: ctx.member.userId, // We'll need to fetch email separately
      metadata: {
        workspaceId: workspace.id,
        workspaceName: workspace.name,
      },
    });
    customerId = customer.id;
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXTAUTH_URL}/settings?billing=success`,
    cancel_url: `${process.env.NEXTAUTH_URL}/settings?billing=cancelled`,
    metadata: {
      workspaceId: workspace.id,
      plan,
    },
  });

  return NextResponse.json({ url: session.url });
}
