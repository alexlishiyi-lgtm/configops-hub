import crypto from 'crypto';

/**
 * Crypto utilities for API key hashing and webhook signatures.
 */

export function sha256(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

export function generateApiKey(): { rawKey: string; hashedKey: string; prefix: string } {
  const random = crypto.randomBytes(24).toString('hex');
  const rawKey = `cop_${random}`;
  const hashedKey = sha256(rawKey);
  const prefix = rawKey.substring(0, 12) + '...';
  return { rawKey, hashedKey, prefix };
}

export function signWebhook(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

export function generateWebhookSecret(): string {
  return crypto.randomBytes(16).toString('hex');
}
