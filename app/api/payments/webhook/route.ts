import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import crypto from 'crypto';

export const runtime = 'nodejs';

export async function POST(req: Request) {
    const body = await req.text();
    const signature = req.headers.get('x-paystack-signature');

    if (!process.env.PAYSTACK_SECRET_KEY) {
        return NextResponse.json({ error: 'Server Config Error' }, { status: 500 });
    }

    // 1. Verify Signature
    const hash = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
        .update(body)
        .digest('hex');

    if (hash !== signature) {
        return NextResponse.json({ error: 'Invalid Signature' }, { status: 400 });
    }

    const event = JSON.parse(body);

    try {
        switch (event.event) {
            case 'charge.success': {
                const data = event.data;
                console.log('--- WEBHOOK CHARGE.SUCCESS ---');
                console.log('Reference:', data.reference);
                console.log('Raw Metadata:', data.metadata);

                // Handle Metadata (Paystack sometimes sends it as a string if stringified on init, or object)
                let metadata = data.metadata;
                if (typeof metadata === 'string') {
                    try {
                        metadata = JSON.parse(metadata);
                    } catch (e) {
                        console.error('Failed to parse (double) stringified metadata:', e);
                    }
                }

                const companyId = metadata?.companyId;
                let plan = metadata?.plan || 'basic'; // Fallback if missing
                const billingCycle = metadata?.billingCycle || 'monthly';

                // FALBACK: Infer Plan from Amount if usage falls back to 'basic'
                // This protects against missing metadata by checking if the amount matches Pro/Enterprise prices
                if (plan === 'basic') {
                    try {
                        const rate = parseFloat(process.env.USD_EXCHANGE_RATE || '1');
                        const paidAmount = data.amount; // in kobo/cents

                        const getExpectedAmount = (priceEnv: string | undefined) => {
                            const p = parseFloat(priceEnv || '0');
                            if (p <= 0) return -1;
                            // Checkout logic: Math.round(Math.round(p * rate * 100) / 100 * 100) ... wait
                            // Checkout: display = p * rate. finalDisplay = round(display*100)/100. Paystack = finalDisplay * 100.
                            // Effectively: Math.round( (Math.round(p * rate * 100)/100) * 100 )
                            const display = p * rate;
                            const finalDisplay = Math.round(display * 100) / 100;
                            return Math.round(finalDisplay * 100);
                        };

                        const proOffer = getExpectedAmount(process.env.PRICE_PRO_MONTHLY_OFFER);
                        const proReg = getExpectedAmount(process.env.PRICE_PRO_MONTHLY);
                        const entOffer = getExpectedAmount(process.env.PRICE_ENTERPRISE_MONTHLY_OFFER);
                        const entReg = getExpectedAmount(process.env.PRICE_ENTERPRISE_MONTHLY);

                        console.log(`Amount Inference Check: Paid ${paidAmount} vs Pro(${proOffer}/${proReg}) Ent(${entOffer}/${entReg})`);

                        if (paidAmount === entOffer || paidAmount === entReg) {
                            plan = 'enterprise';
                            console.log('Inferring Plan: ENTERPRISE');
                        } else if (paidAmount === proOffer || paidAmount === proReg) {
                            plan = 'pro';
                            console.log('Inferring Plan: PRO');
                        }
                    } catch (e) {
                        console.error('Inference Error:', e);
                    }
                }

                console.log('Parsed CompanyId:', companyId);
                console.log('Final Plan:', plan);

                if (companyId) {
                    // 1. Log Payment
                    await supabaseAdmin.schema('employer').from('payments').insert({
                        company_id: companyId,
                        paystack_reference: data.reference,
                        amount: data.amount,
                        currency: data.currency,
                        status: data.status
                    });

                    // 2. Invalidate Previous Active Subscriptions (Strict Upgrade/Downgrade)
                    // This ensures the new one we are about to insert is the ONLY active one.
                    await supabaseAdmin
                        .schema('employer')
                        .from('subscriptions')
                        .update({ status: 'replaced' })
                        .eq('company_id', companyId)
                        .eq('status', 'active');

                    // 3. Grant Access (Insert New Subscription)
                    // Use the parsed variables from above, do not redeclare.

                    // Calculate end date based on cycle
                    const endDate = new Date();
                    if (billingCycle === 'yearly') {
                        endDate.setFullYear(endDate.getFullYear() + 1);
                    } else {
                        endDate.setMonth(endDate.getMonth() + 1);
                    }

                    await supabaseAdmin.schema('employer').from('subscriptions').upsert({
                        company_id: companyId,
                        status: 'active',
                        plan_type: plan,
                        billing_cycle: billingCycle,
                        current_period_end: endDate.toISOString(),
                        paystack_subscription_code: data.subscription_code || ('one_time_' + data.reference),
                        paystack_email_token: data.email_token || 'one_time',
                        // Reset usage on new payment
                        usage_jobs: 0,
                        usage_connections: 0,
                        usage_top_matches: 0
                    });

                    // 4. Sync Badge Type
                    let badge = 'gray';
                    if (plan === 'pro') badge = 'blue';
                    if (plan === 'enterprise') badge = 'gold';
                    if (plan === 'verified') badge = 'blue';

                    await supabaseAdmin.schema('employer').from('companies').update({ badge_type: badge }).eq('id', companyId);
                }
                break;
            }

            case 'subscription.create': {
                const data = event.data;
                const companyId = data.metadata?.companyId;

                // We MUST NOT insert a new row here because we lack Plan Metadata.
                // This event often races with charge.success. 
                // We strictly use this to ENRICH the existing active subscription with codes if needed.

                let targetCompanyId = companyId;

                if (targetCompanyId) {
                    await supabaseAdmin.schema('employer')
                        .from('subscriptions')
                        .update({
                            paystack_subscription_code: data.subscription_code,
                            paystack_email_token: data.email_token,
                            current_period_end: data.next_payment_date
                        })
                        .eq('company_id', targetCompanyId)
                        .eq('status', 'active');
                }
                break;
            }
            case 'subscription.disable': {
                const data = event.data;
                await supabaseAdmin.schema('employer').from('subscriptions').update({ status: 'cancelled' }).eq('paystack_subscription_code', data.subscription_code);
                break;
            }
        }
    } catch (error) {
        console.error('Webhook Error:', error);
        return NextResponse.json({ error: 'Handler Failed' }, { status: 500 });
    }

    return NextResponse.json({ received: true });
}
