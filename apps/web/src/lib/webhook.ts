import { db } from '@/lib/db';
import { signWebhook } from '@/lib/crypto';

interface WebhookEvent {
  workspaceId: string;
  event: string;
  data: Record<string, unknown>;
}

/**
 * Trigger webhooks for a workspace event.
 * Called after config/package/member mutations.
 * Fire-and-forget — does not block the main operation.
 */
export async function triggerWebhooks(event: WebhookEvent) {
  try {
    const webhooks = await db.webhook.findMany({
      where: {
        workspaceId: event.workspaceId,
        isActive: true,
        events: { has: event.event },
      },
    });

    if (webhooks.length === 0) return;

    const payload = JSON.stringify({
      event: event.event,
      timestamp: new Date().toISOString(),
      data: event.data,
    });

    // Fire all webhooks in parallel (non-blocking)
    await Promise.allSettled(
      webhooks.map(async (webhook) => {
        const signature = signWebhook(payload, webhook.secret);
        try {
          const res = await fetch(webhook.url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-ConfigOps-Event': event.event,
              'X-ConfigOps-Signature': signature,
            },
            body: payload,
            signal: AbortSignal.timeout(10000), // 10s timeout
          });

          // Update last response
          await db.webhook.update({
            where: { id: webhook.id },
            data: {
              lastResponseCode: res.status,
              lastTriggeredAt: new Date(),
            },
          });
        } catch (err) {
          // Network error / timeout
          await db.webhook.update({
            where: { id: webhook.id },
            data: {
              lastResponseCode: 0,
              lastTriggeredAt: new Date(),
            },
          });
        }
      })
    );
  } catch {
    // Webhook failures should never affect the main operation
  }
}
