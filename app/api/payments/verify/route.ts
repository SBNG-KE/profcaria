
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { Paystack } from '@/lib/paystack';
import { PROFESSIONAL_PLANS } from '@/lib/billing-config';

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
        let metadata = data.metadata;
        if (typeof metadata === 'string') {
            try { metadata = JSON.parse(metadata); } catch (e) { }
        }

        const userId = metadata?.userId || metadata?.companyId; // 'companyId' legacy compat
        const entityType = metadata?.entityType || 'employer'; // default to employer for legacy
        const plan = metadata?.plan || 'basic';
        const isAd = metadata?.isAd;

        console.log(`[VERIFY] User=${userId} Type=${entityType} Plan=${plan} IsAd=${isAd}`);

        if (userId) {
            const schema = entityType === 'employer' ? 'employer' : 'professional';

            // --- A. AD CREDIT PURCHASE ---
            // --- A. AD / BOOST PURCHASE ---
            if (isAd) {
                if (metadata.isCustomBoost) {
                    const budget = parseFloat(metadata.boostBudget);
                    const durationDays = parseInt(metadata.boostDuration);
                    const postId = metadata.postId;

                    if (postId && !isNaN(budget) && !isNaN(durationDays)) {
                        // Calculate End Date
                        const endDate = new Date();
                        endDate.setDate(endDate.getDate() + durationDays);

                        const tableName = entityType === 'employer' ? 'posts' : 'posts'; // same table name in diff schemas

                        // Update Post directly
                        await supabaseAdmin
                            .schema(schema)
                            .from(tableName)
                            .update({
                                boost_status: 'active',
                                boost_budget: budget,
                                boost_duration_days: durationDays,
                                boost_start_at: new Date().toISOString(),
                                boost_end_at: endDate.toISOString()
                            })
                            .eq('id', postId);

                        // Log Payment (Only for employer for now as per legacy schema, or add professional payments if table exists)
                        // For reliability, we should probably have a payments table for professionals too effectively, 
                        // but avoiding schema changes not in plan.
                        if (entityType === 'employer') {
                            await supabaseAdmin.schema('employer').from('payments').insert({
                                company_id: userId,
                                paystack_reference: data.reference,
                                amount: data.amount,
                                currency: data.currency,
                                status: 'success',
                                type: 'ad_boost', // New type
                                metadata: metadata
                            });
                        }
                    }
                } else {
                    // LEGACY: Ad Credits (Fallback if old packages used)
                    const credits = metadata.credits || 0;
                    const { data: current } = await supabaseAdmin
                        .schema(schema)
                        .from(entityType === 'employer' ? 'companies' : 'users')
                        .select('ad_credits')
                        .eq('id', userId)
                        .single();

                    const newTotal = (current?.ad_credits || 0) + credits;

                    await supabaseAdmin
                        .schema(schema)
                        .from(entityType === 'employer' ? 'companies' : 'users')
                        .update({ ad_credits: newTotal })
                        .eq('id', userId);
                }
            }
            // --- B. SUBSCRIPTION ---
            // --- B. SUBSCRIPTION ---
            else {
                // Determine Badge Type
                let badge = 'none';
                if (entityType === 'professional') {
                    const p = Object.values(PROFESSIONAL_PLANS).find(x => x.name.toLowerCase() === plan.toLowerCase());
                    if (p) badge = p.badge;
                } else {
                    // Employer mapping
                    if (plan === 'basic') badge = 'gray';
                    if (plan === 'pro') badge = 'blue';
                    if (plan === 'enterprise') badge = 'gold';
                }

                if (entityType === 'employer') {
                    // 1. Log Payment
                    await supabaseAdmin.schema('employer').from('payments').insert({
                        company_id: userId,
                        paystack_reference: data.reference,
                        amount: data.amount,
                        currency: data.currency,
                        status: data.status
                    });

                    // 2. Invalidate Previous
                    await supabaseAdmin.schema('employer').from('subscriptions')
                        .update({ status: 'replaced' })
                        .eq('company_id', userId)
                        .eq('status', 'active');

                    // 3. Upsert New Subscription
                    const endDate = new Date();
                    endDate.setMonth(endDate.getMonth() + 1);

                    await supabaseAdmin.schema('employer').from('subscriptions').insert({
                        company_id: userId,
                        status: 'active',
                        plan_type: plan,
                        current_period_end: endDate.toISOString(),
                        paystack_subscription_code: data.subscription_code || ('one_time_' + data.reference),
                        paystack_email_token: data.email_token || 'one_time',
                        usage_jobs: 0,
                        usage_connections: 0,
                        usage_top_matches: 0
                    });

                    // 4. Update Badge
                    await supabaseAdmin.schema('employer').from('companies')
                        .update({ badge_type: badge })
                        .eq('id', userId);

                } else {
                    // PROFESSIONAL SUBSCRIPTION
                    // 1. Invalidate Previous
                    await supabaseAdmin.schema('professional').from('subscriptions')
                        .update({ status: 'replaced' })
                        .eq('user_id', userId)
                        .eq('status', 'active');

                    // 2. Insert New
                    const endDate = new Date();
                    endDate.setMonth(endDate.getMonth() + 1);

                    await supabaseAdmin.schema('professional').from('subscriptions').insert({
                        user_id: userId,
                        plan_type: plan, // basic, standard, premium
                        status: 'active',
                        current_period_end: endDate.toISOString(),
                        paystack_subscription_code: data.subscription_code || ('one_time_' + data.reference),
                        paystack_email_token: data.email_token || 'one_time',
                        amount_paid: data.amount / 100
                    });

                    // 3. Update Badge
                    await supabaseAdmin.schema('professional').from('users')
                        .update({ badge_type: badge })
                        .eq('id', userId);
                }
            }
        }

        return NextResponse.json({ success: true, plan, isAd });

    } catch (error) {
        console.error('Verify Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
