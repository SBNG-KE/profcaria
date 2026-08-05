import { randomBytes } from 'crypto';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { ProfcariaPaystack } from '@/lib/paystack-wallet';
import { checkRateLimit, getClientIdentifier, rateLimitedResponse } from '@/lib/rate-limit';
import { getCompanyPaymentContext } from '../shared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const context = await getCompanyPaymentContext(typeof body.organizationId === 'string' ? body.organizationId : null);
    if (!context) return NextResponse.json({ error: 'Company sign-in required.' }, { status: 401 });
    const limit = await checkRateLimit(getClientIdentifier(request, context.userId), 'payment');
    if (!limit.allowed) return rateLimitedResponse(limit.resetIn);
    if (!ProfcariaPaystack.isConfigured()) {
      return NextResponse.json({ error: 'Paystack is prepared but not connected. Add a test secret key first.' }, { status: 503 });
    }

    const amountKes = Number(body.amountKes);
    if (!Number.isFinite(amountKes) || amountKes < 100 || amountKes > 1_000_000 || Math.round(amountKes * 100) !== amountKes * 100) {
      return NextResponse.json({ error: 'Top-ups must be between KES 100 and KES 1,000,000, with at most two decimal places.' }, { status: 400 });
    }

    const amountSubunit = Math.round(amountKes * 100);
    const reference = `PCW_${Date.now()}_${randomBytes(6).toString('hex')}`;
    const { data: payment, error: insertError } = await supabaseAdmin.schema('profcaria').from('payment_transactions').insert({
      organization_id: context.organizationId,
      initiated_by: context.userId,
      reference,
      amount_kes: amountKes,
      amount_subunit: amountSubunit,
      payer_email_hash: context.emailHash,
    }).select('id').single();
    if (insertError || !payment) throw new Error('Payment record could not be created.');

    const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
    const baseUrl = configuredUrl && /^https?:\/\//.test(configuredUrl) ? configuredUrl.replace(/\/$/, '') : new URL(request.url).origin;
    try {
      const response = await ProfcariaPaystack.initializeWalletTopup({
        email: context.email,
        amountSubunit,
        reference,
        callbackUrl: `${baseUrl}/payment/paystack/callback`,
        organizationId: context.organizationId,
        paymentId: payment.id,
      });
      return NextResponse.json({
        authorizationUrl: response.data.authorization_url,
        reference: response.data.reference,
        mode: ProfcariaPaystack.mode(),
      });
    } catch (error) {
      await supabaseAdmin.schema('profcaria').from('payment_transactions')
        .update({ status: 'failed', updated_at: new Date().toISOString() }).eq('reference', reference);
      throw error;
    }
  } catch (error) {
    console.error('[Paystack initialize]', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Payment initialization failed.' }, { status: 500 });
  }
}
