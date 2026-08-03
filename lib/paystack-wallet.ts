import { createHmac, timingSafeEqual } from 'crypto';

const PAYSTACK_API = 'https://api.paystack.co';
const REFERENCE_PATTERN = /^[A-Za-z0-9._=-]{6,120}$/;

type PaystackEnvelope<T> = {
  status: boolean;
  message: string;
  data: T;
};

export type PaystackVerification = {
  id: number;
  status: string;
  reference: string;
  amount: number;
  currency: string;
  channel?: string;
  paid_at?: string | null;
  fees?: number | null;
};

function secretKey() {
  const key = process.env.PAYSTACK_SECRET_KEY?.trim();
  if (!key) throw new Error('Paystack is not connected yet. Add PAYSTACK_SECRET_KEY to the server environment.');
  return key;
}

async function paystackRequest<T>(path: string, init?: RequestInit): Promise<PaystackEnvelope<T>> {
  const response = await fetch(`${PAYSTACK_API}${path}`, {
    ...init,
    cache: 'no-store',
    signal: AbortSignal.timeout(15_000),
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
  const body = await response.json().catch(() => null) as PaystackEnvelope<T> | null;
  if (!response.ok || !body?.status) {
    throw new Error(body?.message || `Paystack returned HTTP ${response.status}.`);
  }
  return body;
}

export const ProfcariaPaystack = {
  isConfigured() {
    return process.env.PAYSTACK_WALLET_ENABLED === 'true' && Boolean(process.env.PAYSTACK_SECRET_KEY?.trim());
  },

  mode() {
    const key = process.env.PAYSTACK_SECRET_KEY?.trim() || '';
    if (key.startsWith('sk_live_')) return 'live' as const;
    if (key.startsWith('sk_test_')) return 'test' as const;
    return 'unconfigured' as const;
  },

  initializeWalletTopup(input: {
    email: string;
    amountSubunit: number;
    reference: string;
    callbackUrl: string;
    organizationId: string;
    paymentId: string;
  }) {
    if (!REFERENCE_PATTERN.test(input.reference)) throw new Error('Invalid payment reference.');
    return paystackRequest<{ authorization_url: string; access_code: string; reference: string }>(
      '/transaction/initialize',
      {
        method: 'POST',
        body: JSON.stringify({
          email: input.email,
          amount: input.amountSubunit,
          currency: 'KES',
          reference: input.reference,
          callback_url: input.callbackUrl,
          metadata: {
            profcaria_payment_id: input.paymentId,
            organization_id: input.organizationId,
            purpose: 'wallet_topup',
            integration_version: 1,
          },
        }),
      },
    );
  },

  verifyTransaction(reference: string) {
    if (!REFERENCE_PATTERN.test(reference)) throw new Error('Invalid payment reference.');
    return paystackRequest<PaystackVerification>(`/transaction/verify/${encodeURIComponent(reference)}`);
  },

  hasValidWebhookSignature(rawBody: string, signature: string | null) {
    if (!signature || !/^[a-f0-9]{128}$/i.test(signature)) return false;
    const expected = createHmac('sha512', secretKey()).update(rawBody).digest('hex');
    return timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signature, 'hex'));
  },
};
