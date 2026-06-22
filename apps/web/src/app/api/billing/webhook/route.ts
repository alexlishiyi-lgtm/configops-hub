import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

/**
 * POST /api/billing/webhook
 * Receives Stripe webhook events and updates the database accordingly.
 *
 * Handles:
 * - checkout.session.completed → activate subscription
 * - customer.subscription.deleted → downgrade to FREE
 * - customer.subscription.updated → update plan
 * - invoice.payment_failed → mark as PAST_DUE
 */
export async function POST(request: NextRequest) {
  if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Stripe webhook not configured' }, { status: 503 });
  }

  const Stripe = (await import('stripe')).default;
  const stripe = new Stripe(STRIPE_SECRET_KEY);

  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    return NextResponse.json({ error: `Invalid signature: ${err.message}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const workspaceId = session.metadata?.workspaceId;
        const plan = session.metadata?.plan as 'PRO' | 'TEAM';

        if (workspaceId && plan) {
          await db.workspace.update({
            where: { id: workspaceId },
            data: { plan },
          });

          const existingSub = await db.subscription.findFirst({
            where: { workspaceId },
          });
          if (existingSub) {
            await db.subscription.update({
              where: { id: existingSub.id },
              data: {
                plan,
                status: 'ACTIVE',
                stripeCustomerId: session.customer as string,
                stripeSubscriptionId: session.subscription as string,
                currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              },
            });
          } else {
            await db.subscription.create({
              data: {
                workspaceId,
                plan,
                status: 'ACTIVE',
                stripeCustomerId: session.customer as string,
                stripeSubscriptionId: session.subscription as string,
                currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              },
            });
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const sub = await db.subscription.findFirst({
          where: { stripeSubscriptionId: subscription.id },
        });

        if (sub) {
          await db.workspace.update({
            where: { id: sub.workspaceId },
            data: { plan: 'FREE' },
          });
          await db.subscription.update({
            where: { id: sub.id },
            data: {
              plan: 'FREE',
              status: 'CANCELED',
              cancelAtPeriodEnd: false,
            },
          });
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as any;
        const sub = await db.subscription.findFirst({
          where: { stripeSubscriptionId: subscription.id },
        });

        if (sub) {
          const status = subscription.status === 'active' ? 'ACTIVE'
            : subscription.status === 'past_due' ? 'PAST_DUE'
            : subscription.status === 'canceled' ? 'CANCELED'
            : 'ACTIVE';

          await db.subscription.update({
            where: { id: sub.id },
            data: {
              status: status as any,
              cancelAtPeriodEnd: subscription.cancel_at_period_end,
              currentPeriodEnd: subscription.current_period_end
                ? new Date(subscription.current_period_end * 1000)
                : null,
            },
          });
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as any;
        const sub = await db.subscription.findFirst({
          where: { stripeSubscriptionId: invoice.subscription as string },
        });

        if (sub) {
          await db.subscription.update({
            where: { id: sub.id },
            data: { status: 'PAST_DUE' },
          });
        }
        break;
      }

      default:
        // Unhandled event type, acknowledge receipt
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Stripe webhook error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
