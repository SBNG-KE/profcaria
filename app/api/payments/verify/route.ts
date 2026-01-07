import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { Paystack } from '@/lib/paystack';

export const runtime = 'nodejs';

export async function POST(req: Request) {
    try {
        const { reference } = await req.json();
        if (!reference) return NextResponse.json({ error: 'Missing reference' }, { status: 400 });

        // 1. Verify with Paystack (Source of Truth)
        const response = await Paystack.verifyTransaction(reference);
        if (!response.status || response.data.status !== 'success') {
            return NextResponse.json({ error: 'Transaction verification failed' }, { status: 400 });
        }

        const data = response.data;
        // TRUST Paystack Metadata for ID
        const companyId = data.metadata?.companyId;

        if (!companyId) {
            return NextResponse.json({ error: 'Transaction missing metadata' }, { status: 400 });
        }

        // 2. Update DB (Idempotent - Upsert)
        // Log Payment
        await supabaseAdmin.schema('employer').from('payments').upsert({
            paystack_reference: data.reference, // Unique key assumption or check constraint
            company_id: companyId,
            amount: data.amount,
            currency: data.currency,
            status: data.status,
            created_at: new Date().toISOString() // Ensure timestamp
        }, { onConflict: 'paystack_reference' });

        // Grant Subscription (30 Days)
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

        const { error: subError } = await supabaseAdmin.schema('employer').from('subscriptions').upsert({
            company_id: companyId,
            status: 'active',
            current_period_end: thirtyDaysFromNow.toISOString(),
            paystack_subscription_code: 'one_time_' + data.reference,
            paystack_email_token: 'one_time'
            // plan: removed
        });

        if (subError) throw subError; // Explicitly check for error

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Verify Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
