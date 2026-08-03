import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { ProfcariaPaystack } from '@/lib/paystack-wallet';
import { getCompanyPaymentContext, finalizeVerifiedTopup } from '../shared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const allowedReference = /^[A-Za-z0-9._=-]{6,120}$/;

export async function GET(request: Request) {
  try {
    const context = await getCompanyPaymentContext();
    if (!context) return NextResponse.json({ error: 'Company sign-in required.' }, { status: 401 });
    const reference = new URL(request.url).searchParams.get('reference') || '';
    if (!allowedReference.test(reference)) return NextResponse.json({ error: 'Invalid payment reference.' }, { status: 400 });

    const { data: payment } = await supabaseAdmin.schema('profcaria').from('payment_transactions')
      .select('organization_id,status,amount_subunit,currency').eq('reference', reference).maybeSingle();
    if (!payment || payment.organization_id !== context.organizationId) {
      return NextResponse.json({ error: 'Payment not found.' }, { status: 404 });
    }
    if (payment.status === 'success') return NextResponse.json({ success: true, credited: false, status: 'success' });

    const response = await ProfcariaPaystack.verifyTransaction(reference);
    const verified = response.data;
    if (verified.amount !== payment.amount_subunit || verified.currency !== payment.currency) {
      await supabaseAdmin.schema('profcaria').from('payment_transactions')
        .update({ status: 'review', updated_at: new Date().toISOString() }).eq('reference', reference);
      return NextResponse.json({ error: 'Payment amount or currency did not match. No wallet credit was issued.' }, { status: 409 });
    }
    if (verified.status !== 'success') {
      const status = ['failed','abandoned','reversed'].includes(verified.status) ? verified.status : 'processing';
      await supabaseAdmin.schema('profcaria').from('payment_transactions')
        .update({ status, updated_at: new Date().toISOString() }).eq('reference', reference);
      return NextResponse.json({ success: false, status: verified.status }, { status: 202 });
    }

    const credited = await finalizeVerifiedTopup(verified);
    return NextResponse.json({ success: true, credited, status: 'success' });
  } catch (error) {
    console.error('[Paystack verify]', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Payment verification failed.' }, { status: 500 });
  }
}
