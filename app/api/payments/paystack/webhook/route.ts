import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { ProfcariaPaystack } from '@/lib/paystack-wallet';
import { finalizeVerifiedTopup } from '../shared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type PaystackEvent = { event?: string; data?: { reference?: string } };

export async function POST(request: Request) {
  const rawBody = await request.text();
  try {
    if (!ProfcariaPaystack.isConfigured()) return NextResponse.json({ error: 'Provider not configured.' }, { status: 503 });
    if (!ProfcariaPaystack.hasValidWebhookSignature(rawBody, request.headers.get('x-paystack-signature'))) {
      return NextResponse.json({ error: 'Invalid signature.' }, { status: 401 });
    }

    const event = JSON.parse(rawBody) as PaystackEvent;
    if (event.event !== 'charge.success') return NextResponse.json({ received: true });
    const reference = event.data?.reference || '';
    if (!/^[A-Za-z0-9._=-]{6,120}$/.test(reference)) return NextResponse.json({ received: true });

    const { data: payment } = await supabaseAdmin.schema('profcaria').from('payment_transactions')
      .select('status,amount_subunit,currency').eq('reference', reference).maybeSingle();
    if (!payment || payment.status === 'success') return NextResponse.json({ received: true });

    const verified = (await ProfcariaPaystack.verifyTransaction(reference)).data;
    if (verified.status !== 'success' || verified.amount !== payment.amount_subunit || verified.currency !== payment.currency) {
      await supabaseAdmin.schema('profcaria').from('payment_transactions')
        .update({ status: 'review', updated_at: new Date().toISOString() }).eq('reference', reference);
      console.error('[Paystack webhook] Verification mismatch', { reference, status: verified.status });
      return NextResponse.json({ received: true });
    }

    await finalizeVerifiedTopup(verified);
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[Paystack webhook]', error);
    return NextResponse.json({ error: 'Webhook processing failed.' }, { status: 500 });
  }
}
