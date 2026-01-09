
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { Paystack } from '@/lib/paystack';

export const runtime = 'nodejs';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const reference = searchParams.get('reference');

    if (!reference) {
        return NextResponse.json({ error: 'Missing reference' }, { status: 400 });
    }

    try {
        // 1. Verify with Paystack
        const verifyRes = await Paystack.verifyTransaction(reference);

        if (!verifyRes.status || !verifyRes.data || verifyRes.data.status !== 'success') {
            return NextResponse.json({ error: 'Transaction verification failed or not successful' }, { status: 400 });
        }

        const data = verifyRes.data;
        console.log('--- MANUAL VERIFY SUCCESS ---');
        console.log('Reference:', data.reference);

        let metadata = data.metadata;
        // Parse metadata if string
        if (typeof metadata === 'string') {
            try {
                metadata = JSON.parse(metadata);
            } catch (e) {
                console.error('Metadata parse error', e);
            }
        }

        const companyId = metadata?.companyId;
        // Logic specific:
        // Use the same robust logic as webhook to determine plan
        let plan = metadata?.plan || 'basic';
        const billingCycle = metadata?.billingCycle || 'monthly';

        // Robust Fallback: Amount Inference
        if (plan === 'basic') {
            try {
                const rate = parseFloat(process.env.USD_EXCHANGE_RATE || '1');
                const paidAmount = data.amount; // kobo

                const getExpectedAmount = (priceEnv: string | undefined) => {
                    const p = parseFloat(priceEnv || '0');
                    if (p <= 0) return -1;
                    const display = p * rate;
                    const finalDisplay = Math.round(display * 100) / 100;
                    return Math.round(finalDisplay * 100);
                };

                const proOffer = getExpectedAmount(process.env.PRICE_PRO_MONTHLY_OFFER);
                const proReg = getExpectedAmount(process.env.PRICE_PRO_MONTHLY);
                const entOffer = getExpectedAmount(process.env.PRICE_ENTERPRISE_MONTHLY_OFFER);
                const entReg = getExpectedAmount(process.env.PRICE_ENTERPRISE_MONTHLY);

                if (paidAmount === entOffer || paidAmount === entReg) plan = 'enterprise';
                else if (paidAmount === proOffer || paidAmount === proReg) plan = 'pro';

            } catch (e) { console.error(e); }
        }

        console.log('Verified Plan:', plan);

        if (companyId) {
            // 1. Log Payment
            await supabaseAdmin.schema('employer').from('payments').insert({
                company_id: companyId,
                paystack_reference: data.reference,
                amount: data.amount,
                currency: data.currency,
                status: data.status
            });

            // 2. Invalidate Previous
            await supabaseAdmin.schema('employer').from('subscriptions')
                .update({ status: 'replaced' })
                .eq('company_id', companyId)
                .eq('status', 'active');

            // 3. Insert New
            const endDate = new Date();
            if (billingCycle === 'yearly') endDate.setFullYear(endDate.getFullYear() + 1);
            else endDate.setMonth(endDate.getMonth() + 1);

            await supabaseAdmin.schema('employer').from('subscriptions').upsert({
                company_id: companyId,
                status: 'active',
                plan_type: plan,
                billing_cycle: billingCycle,
                current_period_end: endDate.toISOString(),
                paystack_subscription_code: data.subscription_code || ('one_time_' + data.reference),
                paystack_email_token: data.email_token || 'one_time',
                usage_jobs: 0,
                usage_connections: 0,
                usage_top_matches: 0
            });
        }

        return NextResponse.json({ success: true, plan });

    } catch (error) {
        console.error('Verify Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
