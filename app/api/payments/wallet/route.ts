import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { ProfcariaPaystack } from '@/lib/paystack-wallet';
import { getCompanyPaymentContext } from '../paystack/shared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const context = await getCompanyPaymentContext();
    if (!context) return NextResponse.json({ error: 'Company sign-in required.' }, { status: 401 });
    const [walletResult, paymentsResult, ledgerResult] = await Promise.all([
      supabaseAdmin.schema('profcaria').from('organization_wallets')
        .select('balance_kes,reserved_kes,updated_at').eq('organization_id', context.organizationId).maybeSingle(),
      supabaseAdmin.schema('profcaria').from('payment_transactions')
        .select('reference,status,amount_kes,currency,channel,paid_at,created_at').eq('organization_id', context.organizationId)
        .order('created_at', { ascending: false }).limit(10),
      supabaseAdmin.schema('profcaria').from('usage_ledger')
        .select('id,kind,quantity,amount_kes,provider_reference,created_at').eq('organization_id', context.organizationId)
        .order('created_at', { ascending: false }).limit(20),
    ]);
    if (walletResult.error || paymentsResult.error || ledgerResult.error) throw new Error('Wallet history could not be loaded.');
    return NextResponse.json({
      wallet: walletResult.data || { balance_kes: 0, reserved_kes: 0, updated_at: null },
      payments: paymentsResult.data || [],
      ledger: ledgerResult.data || [],
      paystack: { configured: ProfcariaPaystack.isConfigured(), mode: ProfcariaPaystack.mode() },
      currency: 'KES',
    });
  } catch (error) {
    console.error('[Wallet]', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Wallet could not be loaded.' }, { status: 500 });
  }
}
