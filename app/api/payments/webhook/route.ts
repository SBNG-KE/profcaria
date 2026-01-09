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
                const plan = metadata?.plan || 'basic'; // Fallback if missing
                const billingCycle = metadata?.billingCycle || 'monthly';

                console.log('Parsed CompanyId:', companyId);
                console.log('Parsed Plan:', plan);

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
                        paystack_subscription_code: 'one_time_' + data.reference,
                        paystack_email_token: 'one_time',
                        // Reset usage on new payment
                        usage_jobs: 0,
                        usage_connections: 0,
                        usage_top_matches: 0
                    });
                }
                break;
            }

            case 'subscription.create': {
                const data = event.data;
                const companyId = data.metadata?.companyId; // Might persist from initial charge metadata?

                // If metadata is sparse in sub events, we might need a lookup via customer_code (which implies we stored it previously)
                // For simplified flow, let's assume we can match via customer email or stored code.

                // For now, let's upsert based on subscription code
                // We might need to find companyId by email if metadata missing
                let targetCompanyId = companyId;

                if (!targetCompanyId && data.customer?.email) {
                    // Find company by blind index email? Or just wait for associated charge.success to handle logging.
                    // Subscriptions are trickier to link without metadata.
                    // Paystack does usually carry over metadata if initial transaction had it.
                }

                if (targetCompanyId) {
                    await supabaseAdmin.schema('employer').from('subscriptions').upsert({
                        company_id: targetCompanyId,
                        paystack_subscription_code: data.subscription_code,
                        paystack_email_token: data.email_token,
                        status: data.status,
                        current_period_end: data.next_payment_date // Paystack sends ISO date usually
                    });
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
