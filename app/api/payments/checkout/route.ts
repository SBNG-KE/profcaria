import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { Paystack } from '@/lib/paystack';
import { decryptData } from '@/lib/security';
import { BILLING_PLANS, PROFESSIONAL_PLANS, AD_PACKAGES } from '@/lib/billing-config';

export const runtime = 'nodejs';

async function getAuthenticatedUser() {
    const cookieStore = await cookies();
    const token = cookieStore.get('profcaria_session')?.value;
    if (!token) return null;
    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        return { uid: payload.uid as string, schema: payload.schema as string };
    } catch {
        return null;
    }
}

export async function POST(req: Request) {
    try {
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { plan, isAd, isOneTime, budget, duration, postId } = await req.json(); // plan can be plan name OR ad package ID

        // We strictly use the fixed USD_EXCHANGE_RATE from env now as requested.
        let exchangeRate = parseFloat(process.env.USD_EXCHANGE_RATE || '1');

        // --- 1. DETERMINE PRICE ---
        let priceUSD = 0;
        let planCodeEnvKey = '';
        let metadata: any = {
            userId: user.uid,
            entityType: user.schema,
            plan: plan,
            postId: postId, // Add Post ID to metadata
            isOneTime: isOneTime || false // Track if this is a one-time payment
        };

        if (isAd) {
            if (plan === 'custom_boost') {
                // Dynamic Boost
                if (!budget || !duration) return NextResponse.json({ error: 'Missing budget or duration' }, { status: 400 });
                priceUSD = parseFloat(budget);
                metadata.isAd = true;
                metadata.isCustomBoost = true;
                metadata.boostBudget = budget;
                metadata.boostDuration = duration;
                // Currently promoted post ID is missing in modal? 
                // Wait, PromotePostModal has 'post' prop. But does it pass post ID to startPayment?
                // The hook 'startPayment' takes args. We need to pass postId to checkout.
                // Re-checking hook... it takes { plan, isAd ... }
                // I need to update hook or pass postId in body.
                // Assuming modal passes it or I update modal to pass it.
                // Let's assume passed in body for now, I will fix Modal to pass postId next if missing.
            } else {
                // Legacy fixed package (fallback)
                const pkg = Object.values(AD_PACKAGES).find(p => p.id === plan);
                if (!pkg) return NextResponse.json({ error: 'Invalid Ad Package' }, { status: 400 });

                priceUSD = pkg.price;
                metadata.isAd = true;
                metadata.credits = pkg.credits;
            }
        } else {
            // Subscription
            if (user.schema === 'employer') {
                const getPrice = (p: string) => {
                    // Reuse existing logic or map from config
                    switch (p) {
                        case 'basic': return (parseFloat(process.env.PRICE_BASIC_MONTHLY_OFFER || '0') || parseFloat(process.env.PRICE_BASIC_MONTHLY || '0'));
                        case 'pro': return (parseFloat(process.env.PRICE_PRO_MONTHLY_OFFER || '0') || parseFloat(process.env.PRICE_PRO_MONTHLY || '0'));
                        case 'enterprise': return (parseFloat(process.env.PRICE_ENTERPRISE_MONTHLY_OFFER || '0') || parseFloat(process.env.PRICE_ENTERPRISE_MONTHLY || '0'));
                        default: return 0;
                    }
                };
                priceUSD = getPrice(plan);
                // Only set plan code for recurring subscriptions, NOT one-time payments
                if (!isOneTime) {
                    planCodeEnvKey = `PAYSTACK_PLAN_${plan.toUpperCase()}_MONTHLY`;
                }
            } else {
                // Professional
                const profPlan = Object.values(PROFESSIONAL_PLANS).find(p => p.name.toLowerCase() === plan.toLowerCase());
                if (!profPlan) return NextResponse.json({ error: 'Invalid Professional Plan' }, { status: 400 });
                priceUSD = profPlan.priceMonthly;
                // Only set plan code for recurring subscriptions, NOT one-time payments
                if (!isOneTime) {
                    // e.g. PAYSTACK_PLAN_PROF_STANDARD_MONTHLY
                    planCodeEnvKey = `PAYSTACK_PLAN_PROF_${plan.toUpperCase()}_MONTHLY`;
                }
            }

            // --- PRORATED PLAN SWITCHING ---
            // Check for existing active subscription
            let proratedRefund = 0;
            let switchingFrom = '';

            if (user.schema === 'employer') {
                const { data: existingSub } = await supabaseAdmin
                    .schema('employer')
                    .from('subscriptions')
                    .select('*')
                    .eq('company_id', user.uid)
                    .eq('status', 'active')
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();

                if (existingSub && existingSub.plan_type !== plan) {
                    // SECURITY: Promo plans do NOT get refunds
                    if (!existingSub.is_promo) {
                        // Calculate remaining days
                        const periodEnd = new Date(existingSub.current_period_end);
                        const now = new Date();
                        const remainingMs = periodEnd.getTime() - now.getTime();
                        const remainingDays = Math.max(0, Math.ceil(remainingMs / (1000 * 60 * 60 * 24)));

                        // Calculate prorated refund: (remaining_days / 30) * amount_paid
                        if (remainingDays > 0 && existingSub.amount_paid > 0) {
                            proratedRefund = (remainingDays / 30) * parseFloat(existingSub.amount_paid);
                        }
                    }
                    switchingFrom = existingSub.plan_type;
                }
            } else {
                const { data: existingSub } = await supabaseAdmin
                    .schema('professional')
                    .from('subscriptions')
                    .select('*')
                    .eq('user_id', user.uid)
                    .eq('status', 'active')
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();

                if (existingSub && existingSub.plan_type !== plan) {
                    // SECURITY: Promo plans do NOT get refunds
                    if (!existingSub.is_promo) {
                        // Calculate remaining days
                        const periodEnd = new Date(existingSub.current_period_end);
                        const now = new Date();
                        const remainingMs = periodEnd.getTime() - now.getTime();
                        const remainingDays = Math.max(0, Math.ceil(remainingMs / (1000 * 60 * 60 * 24)));

                        // Calculate prorated refund: (remaining_days / 30) * amount_paid
                        if (remainingDays > 0 && existingSub.amount_paid > 0) {
                            proratedRefund = (remainingDays / 30) * parseFloat(existingSub.amount_paid);
                        }
                    }
                    switchingFrom = existingSub.plan_type;
                }
            }

            // Apply prorated refund to new plan price
            if (proratedRefund > 0) {
                priceUSD = Math.max(0, priceUSD - proratedRefund);
                metadata.proratedRefund = proratedRefund.toFixed(2);
                metadata.switchingFrom = switchingFrom;
            }
        }

        if (priceUSD <= 0 && !isAd && plan !== 'free') {
            // If proration makes price 0 or negative, treat as free switch
            // This can happen if someone switches to a cheaper plan with proration credit
            // We'll still process it but with $0 charge
            if (priceUSD < 0) {
                // User has excess credit - for now, just set to 0
                // Future: Could store credit for next billing cycle
                priceUSD = 0;
            }
        }

        // --- 2. GET USER DETAILS ---
        let email = '';
        if (user.schema === 'employer') {
            const { data: company } = await supabaseAdmin.schema('employer').from('companies').select('enc_work_email').eq('id', user.uid).single();
            if (company) email = decryptData(company.enc_work_email) || '';
        } else {
            const { data: prof } = await supabaseAdmin.schema('professional').from('users').select('enc_email').eq('id', user.uid).single();
            if (prof) email = decryptData(prof.enc_email) || '';
        }

        if (!email) return NextResponse.json({ error: 'Email not found' }, { status: 400 });

        // --- 3. PREPARE PAYSTACK ---
        const displayAmount = priceUSD * exchangeRate;
        // Round to 2 decimals
        const finalDisplayAmount = Math.round(displayAmount * 100) / 100;

        const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'https://profcaria.com';
        const paystackPlanCode = process.env[planCodeEnvKey]; // Undefined for ads or one-time

        // Initialize
        const response = await Paystack.initializeTransaction(
            email,
            finalDisplayAmount,
            `${origin}/payment/callback`, // Callback URL (still used for reference even if popup handles closing)
            metadata,
            paystackPlanCode
        );

        if (!response.status) {
            return NextResponse.json({ error: 'Paystack Init Failed: ' + response.message }, { status: 400 });
        }

        return NextResponse.json({
            url: response.data.authorization_url,
            accessCode: response.data.access_code,
            reference: response.data.reference
        });

    } catch (error: any) {
        console.error('Checkout Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
