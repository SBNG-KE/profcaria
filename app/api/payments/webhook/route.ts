import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { decryptData } from '@/lib/security';
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

                let companyId = metadata?.companyId;
                let userId = metadata?.userId;
                let plan = metadata?.plan;
                const billingCycle = metadata?.billingCycle || 'monthly';
                const subscriptionCode = data.subscription_code;
                const email = data.customer?.email;

                // --- FALLBACK LOOKUP FOR RECURRING PAYMENTS ---
                // If metadata is missing (common on auto-renewals), try to find the owner via subscription_code or email
                if (!companyId && !userId && subscriptionCode) {
                    console.log(`[WEBHOOK] Metadata missing. Attempting lookup by subscription_code: ${subscriptionCode}`);

                    // Try Employer First (exact match)
                    const { data: bSub } = await supabaseAdmin.schema('employer').from('subscriptions')
                        .select('company_id, plan_type').eq('paystack_subscription_code', subscriptionCode).single();

                    if (bSub) {
                        companyId = bSub.company_id;
                        if (!plan) plan = bSub.plan_type;
                        console.log('[WEBHOOK] Found Employer via SubCode:', companyId);
                    } else {
                        // Try Professional (exact match)
                        const { data: pSub } = await supabaseAdmin.schema('professional').from('subscriptions')
                            .select('user_id, plan_type').eq('paystack_subscription_code', subscriptionCode).single();

                        if (pSub) {
                            userId = pSub.user_id;
                            if (!plan) plan = pSub.plan_type;
                            console.log('[WEBHOOK] Found Professional via SubCode:', userId);
                        }
                    }
                }

                // Fallback by Email if still not found
                if (!companyId && !userId && email) {
                    console.log(`[WEBHOOK] SubCode lookup failed. Attempting lookup by email: ${email}`);

                    // Try Employer: scan companies for matching encrypted work email
                    const { data: companies } = await supabaseAdmin.schema('employer').from('companies')
                        .select('id, enc_work_email');
                    if (companies) {
                        for (const company of companies) {
                            try {
                                const decryptedEmail = decryptData(company.enc_work_email);
                                if (decryptedEmail && decryptedEmail.toLowerCase() === email.toLowerCase()) {
                                    // Verify they have an active subscription
                                    const { data: activeSub } = await supabaseAdmin.schema('employer').from('subscriptions')
                                        .select('plan_type').eq('company_id', company.id).eq('status', 'active').single();
                                    if (activeSub) {
                                        companyId = company.id;
                                        if (!plan) plan = activeSub.plan_type;
                                        console.log('[WEBHOOK] Found Employer via Email match:', companyId);

                                        // BONUS: Update the subscription_code so future lookups are instant
                                        if (subscriptionCode) {
                                            await supabaseAdmin.schema('employer').from('subscriptions')
                                                .update({ paystack_subscription_code: subscriptionCode })
                                                .eq('company_id', companyId)
                                                .eq('status', 'active');
                                            console.log('[WEBHOOK] Updated employer subscription_code to real code:', subscriptionCode);
                                        }
                                        break;
                                    }
                                }
                            } catch { /* skip decryption errors */ }
                        }
                    }

                    // Try Professional
                    if (!companyId && !userId) {
                        const { data: pUser } = await supabaseAdmin.schema('professional').from('users')
                            .select('id').eq('email', email).single();
                        if (pUser) {
                            userId = pUser.id;
                            console.log('[WEBHOOK] Found Professional via Email:', userId);

                            // Update subscription_code so future lookups are instant
                            if (subscriptionCode) {
                                await supabaseAdmin.schema('professional').from('subscriptions')
                                    .update({ paystack_subscription_code: subscriptionCode })
                                    .eq('user_id', userId)
                                    .eq('status', 'active');
                                console.log('[WEBHOOK] Updated professional subscription_code to real code:', subscriptionCode);
                            }
                        }
                    }
                }

                if (!companyId && !userId) {
                    console.error('[WEBHOOK] CRITICAL: Could not identify subscription owner.', { email, subscriptionCode, reference: data.reference });
                }


                // FALBACK: Infer Plan from Amount if usage falls back to 'basic' or is undefined
                if (!plan || plan === 'basic') {
                    try {
                        const rate = parseFloat(process.env.USD_EXCHANGE_RATE || '1');
                        const paidAmount = data.amount; // in kobo/cents

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

                // If we still don't have a plan, default to basic (or whatever was there)
                if (!plan) plan = 'basic';

                console.log('[WEBHOOK] Final Target:', { companyId, userId, plan, subscriptionCode });

                if (companyId) {
                    // EMPLOYER SUBSCRIPTION HANDLING
                    const proratedRefund = metadata?.proratedRefund ? parseFloat(metadata.proratedRefund) : 0;
                    const switchingFrom = metadata?.switchingFrom || null;
                    const isOneTime = metadata?.isOneTime || false;

                    // 1. Log Payment
                    await supabaseAdmin.schema('employer').from('payments').insert({
                        company_id: companyId,
                        paystack_reference: data.reference,
                        amount: data.amount,
                        currency: data.currency,
                        status: data.status
                    });

                    // 2. Update Previous Active Subscriptions with switch info
                    // Only if this is a NEW switch/subscription, usually indicated by metadata.
                    // For recurring, we just upsert.
                    if (switchingFrom) {
                        await supabaseAdmin
                            .schema('employer')
                            .from('subscriptions')
                            .update({
                                status: 'switched',
                                switched_from: null
                            })
                            .eq('company_id', companyId)
                            .eq('status', 'active');
                    }

                    // 3. Grant Access (Insert New Subscription or Update Existing)
                    const endDate = new Date();
                    if (billingCycle === 'yearly') {
                        endDate.setFullYear(endDate.getFullYear() + 1);
                    } else {
                        endDate.setMonth(endDate.getMonth() + 1);
                    }

                    // Calculate actual amount paid in USD for future proration
                    const rate = parseFloat(process.env.USD_EXCHANGE_RATE || '1');
                    const amountPaidUSD = (data.amount / 100) / rate;

                    await supabaseAdmin.schema('employer').from('subscriptions').upsert({
                        company_id: companyId,
                        status: 'active',
                        plan_type: plan,
                        billing_cycle: billingCycle,
                        current_period_end: endDate.toISOString(),
                        current_period_start: new Date().toISOString(),
                        paystack_subscription_code: data.subscription_code || ('one_time_' + data.reference),
                        paystack_email_token: data.email_token || 'one_time',
                        amount_paid: amountPaidUSD.toFixed(2),
                        prorated_refund: proratedRefund.toFixed(2),
                        switched_from: switchingFrom,
                        is_one_time: isOneTime,
                        // Reset usage on new payment? 
                        // Maybe only if it's a new cycle. Upsert helps here.
                        usage_jobs: 0,
                        usage_connections: 0,
                        usage_top_matches: 0
                    }, { onConflict: 'company_id, status' }); // Warning: This onConflict might be tricky if we have multiple active rows? Schema enforces one active?

                    // 4. Sync Badge Type
                    let badge = 'gray';
                    if (plan === 'pro') badge = 'blue';
                    if (plan === 'enterprise') badge = 'gold';

                    await supabaseAdmin.schema('employer').from('companies').update({ badge_type: badge }).eq('id', companyId);
                }

                if (userId) {
                    // PROFESSIONAL SUBSCRIPTION HANDLING
                    const proratedRefund = metadata?.proratedRefund ? parseFloat(metadata.proratedRefund) : 0;
                    const switchingFrom = metadata?.switchingFrom || null;
                    const isOneTime = metadata?.isOneTime || false;

                    // 1. Update Previous Active Subscriptions
                    if (switchingFrom) {
                        await supabaseAdmin
                            .schema('professional')
                            .from('subscriptions')
                            .update({
                                status: 'switched',
                                switched_from: null
                            })
                            .eq('user_id', userId)
                            .eq('status', 'active');
                    }

                    // 2. Grant Access
                    const endDate = new Date();
                    if (billingCycle === 'yearly') {
                        endDate.setFullYear(endDate.getFullYear() + 1);
                    } else {
                        endDate.setMonth(endDate.getMonth() + 1);
                    }

                    const rate = parseFloat(process.env.USD_EXCHANGE_RATE || '1');
                    const amountPaidUSD = (data.amount / 100) / rate;

                    await supabaseAdmin.schema('professional').from('subscriptions').upsert({
                        user_id: userId,
                        status: 'active',
                        plan_type: plan,
                        current_period_end: endDate.toISOString(),
                        current_period_start: new Date().toISOString(),
                        paystack_subscription_code: data.subscription_code || ('one_time_' + data.reference),
                        paystack_email_token: data.email_token || 'one_time',
                        amount_paid: amountPaidUSD.toFixed(2),
                        prorated_refund: proratedRefund.toFixed(2),
                        switched_from: switchingFrom,
                        is_one_time: isOneTime
                    }); // Remove explicit onConflict to let it infer if PK matches or just insert new history? 
                    // Ideally we want one ACTIVE row per user.

                    // 3. Sync Badge Type
                    let badge = 'none';
                    if (plan === 'basic') badge = 'gray';
                    if (plan === 'standard') badge = 'blue';
                    if (plan === 'premium') badge = 'gold';

                    await supabaseAdmin.schema('professional').from('users').update({ badge_type: badge }).eq('id', userId);
                }
                break;
            }

            case 'subscription.create': {
                const data = event.data;
                console.log('[WEBHOOK] --- SUBSCRIPTION.CREATE ---');
                console.log('[WEBHOOK] SubCode:', data.subscription_code, 'Email:', data.customer?.email);

                let metadata = data.metadata;
                if (typeof metadata === 'string') {
                    try { metadata = JSON.parse(metadata); } catch { }
                }

                let companyId = metadata?.companyId;
                let userId = metadata?.userId;
                const email = data.customer?.email;

                // If metadata has IDs, update directly
                if (companyId) {
                    const { error } = await supabaseAdmin.schema('employer')
                        .from('subscriptions')
                        .update({
                            paystack_subscription_code: data.subscription_code,
                            paystack_email_token: data.email_token,
                            current_period_end: data.next_payment_date
                        })
                        .eq('company_id', companyId)
                        .eq('status', 'active');
                    if (error) console.error('[WEBHOOK] Employer sub.create update failed:', error);
                    else console.log('[WEBHOOK] Updated employer subscription via metadata:', companyId);
                } else if (userId) {
                    const { error } = await supabaseAdmin.schema('professional')
                        .from('subscriptions')
                        .update({
                            paystack_subscription_code: data.subscription_code,
                            paystack_email_token: data.email_token,
                            current_period_end: data.next_payment_date
                        })
                        .eq('user_id', userId)
                        .eq('status', 'active');
                    if (error) console.error('[WEBHOOK] Professional sub.create update failed:', error);
                    else console.log('[WEBHOOK] Updated professional subscription via metadata:', userId);
                } else if (email) {
                    // No metadata — find owner by email
                    console.log('[WEBHOOK] sub.create: No metadata IDs, searching by email:', email);
                    let found = false;

                    // Try Employer: match encrypted work email
                    const { data: companies } = await supabaseAdmin.schema('employer').from('companies')
                        .select('id, enc_work_email');
                    if (companies) {
                        for (const company of companies) {
                            try {
                                const decryptedEmail = decryptData(company.enc_work_email);
                                if (decryptedEmail && decryptedEmail.toLowerCase() === email.toLowerCase()) {
                                    const { error } = await supabaseAdmin.schema('employer')
                                        .from('subscriptions')
                                        .update({
                                            paystack_subscription_code: data.subscription_code,
                                            paystack_email_token: data.email_token,
                                            current_period_end: data.next_payment_date
                                        })
                                        .eq('company_id', company.id)
                                        .eq('status', 'active');
                                    if (!error) {
                                        console.log('[WEBHOOK] Updated employer sub via email match:', company.id);
                                        found = true;
                                    }
                                    break;
                                }
                            } catch { /* skip */ }
                        }
                    }

                    // Try Professional
                    if (!found) {
                        const { data: pUser } = await supabaseAdmin.schema('professional').from('users')
                            .select('id').eq('email', email).single();
                        if (pUser) {
                            const { error } = await supabaseAdmin.schema('professional')
                                .from('subscriptions')
                                .update({
                                    paystack_subscription_code: data.subscription_code,
                                    paystack_email_token: data.email_token,
                                    current_period_end: data.next_payment_date
                                })
                                .eq('user_id', pUser.id)
                                .eq('status', 'active');
                            if (!error) console.log('[WEBHOOK] Updated professional sub via email match:', pUser.id);
                        }
                    }
                } else {
                    console.error('[WEBHOOK] sub.create: No metadata and no email — cannot update subscription.');
                }
                break;
            }
            case 'subscription.disable': {
                const data = event.data;
                console.log('[WEBHOOK] --- SUBSCRIPTION.DISABLE ---', data.subscription_code);
                // Try both schemas
                await supabaseAdmin.schema('employer').from('subscriptions')
                    .update({ status: 'cancelled' }).eq('paystack_subscription_code', data.subscription_code);
                await supabaseAdmin.schema('professional').from('subscriptions')
                    .update({ status: 'cancelled' }).eq('paystack_subscription_code', data.subscription_code);
                break;
            }

            case 'subscription.not_renew': {
                const data = event.data;
                console.log('[WEBHOOK] --- SUBSCRIPTION.NOT_RENEW ---', data.subscription_code);
                // Mark as not renewing but still active until period end
                await supabaseAdmin.schema('employer').from('subscriptions')
                    .update({ status: 'cancelled' }).eq('paystack_subscription_code', data.subscription_code);
                await supabaseAdmin.schema('professional').from('subscriptions')
                    .update({ status: 'cancelled' }).eq('paystack_subscription_code', data.subscription_code);
                break;
            }

            case 'invoice.payment_failed': {
                const data = event.data;
                console.error('[WEBHOOK] --- INVOICE.PAYMENT_FAILED ---', {
                    subscriptionCode: data.subscription?.subscription_code,
                    email: data.customer?.email,
                    amount: data.amount
                });
                // Don't cancel yet — Paystack will retry. Just log for monitoring.
                break;
            }
        }
    } catch (error) {
        console.error('Webhook Error:', error);
        return NextResponse.json({ error: 'Handler Failed' }, { status: 500 });
    }

    return NextResponse.json({ received: true });
}
