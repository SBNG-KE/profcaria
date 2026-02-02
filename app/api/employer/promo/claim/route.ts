import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { sendPromoWelcomeEmail } from '@/lib/email';
import { decryptData } from '@/lib/security';

// API to check and apply early adopter promotion for employers
export async function POST(req: NextRequest) {
    try {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get('employer_session');

        if (!sessionCookie?.value) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const session = JSON.parse(sessionCookie.value);
        const companyId = session.companyId;

        if (!companyId) {
            return NextResponse.json({ error: 'Company not found' }, { status: 400 });
        }

        // Check if company already has an active paid subscription
        const { data: existingSub } = await supabaseAdmin
            .schema('employer')
            .from('subscriptions')
            .select('*')
            .eq('company_id', companyId)
            .eq('status', 'active')
            .single();

        if (existingSub && existingSub.plan_type !== 'free') {
            return NextResponse.json({
                eligible: false,
                reason: 'Already has active subscription',
                current_plan: existingSub.plan_type
            });
        }

        // Check if already claimed
        const { data: existingClaim } = await supabaseAdmin
            .from('promotion_claims')
            .select('*')
            .eq('promo_code', 'EARLY_EMPLOYER_10')
            .eq('company_id', companyId)
            .single();

        if (existingClaim) {
            return NextResponse.json({
                eligible: false,
                reason: 'Already claimed this promotion',
                expires_at: existingClaim.expires_at
            });
        }

        // Check promotion availability
        const { data: promo } = await supabaseAdmin
            .from('promotions')
            .select('*')
            .eq('promo_code', 'EARLY_EMPLOYER_10')
            .eq('is_active', true)
            .single();

        if (!promo) {
            return NextResponse.json({
                eligible: false,
                reason: 'Promotion not found or inactive'
            });
        }

        if (promo.current_claims >= promo.max_claims) {
            return NextResponse.json({
                eligible: false,
                reason: 'Promotion limit reached (10 companies)',
                spots_remaining: 0
            });
        }

        // Calculate expiry (1 month = 30 days)
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + promo.duration_days);

        // Start transaction: claim promo and create subscription
        // 1. Increment promo claims
        await supabaseAdmin
            .from('promotions')
            .update({ current_claims: promo.current_claims + 1 })
            .eq('promo_code', 'EARLY_EMPLOYER_10');

        // 2. Record the claim
        await supabaseAdmin
            .from('promotion_claims')
            .insert({
                promo_code: 'EARLY_EMPLOYER_10',
                company_id: companyId,
                expires_at: expiresAt.toISOString()
            });

        // 3. Create or update subscription to pro
        if (existingSub) {
            await supabaseAdmin
                .schema('employer')
                .from('subscriptions')
                .update({
                    plan_type: 'pro',
                    status: 'active',
                    is_promo: true,
                    promo_type: 'early_adopter_employer',
                    promo_expires_at: expiresAt.toISOString(),
                    current_period_end: expiresAt.toISOString()
                })
                .eq('id', existingSub.id);
        } else {
            await supabaseAdmin
                .schema('employer')
                .from('subscriptions')
                .insert({
                    company_id: companyId,
                    plan_type: 'pro',
                    status: 'active',
                    is_promo: true,
                    promo_type: 'early_adopter_employer',
                    promo_expires_at: expiresAt.toISOString(),
                    current_period_start: new Date().toISOString(),
                    current_period_end: expiresAt.toISOString()
                });
        }

        // 4. Update company badge_type to 'blue' for Pro tier
        await supabaseAdmin
            .schema('employer')
            .from('companies')
            .update({ badge_type: 'blue' })
            .eq('id', companyId);

        // 5. Send welcome email
        try {
            const { data: company } = await supabaseAdmin
                .schema('employer')
                .from('companies')
                .select('admin_email, enc_name')
                .eq('id', companyId)
                .single();

            if (company?.admin_email && company.enc_name) {
                const companyName = decryptData(company.enc_name) || 'Company';
                await sendPromoWelcomeEmail(
                    company.admin_email,
                    companyName,
                    'Pro',
                    expiresAt.toISOString(),
                    'employer'
                );
            }
        } catch (emailError) {
            console.error('Promo welcome email failed:', emailError);
            // Don't fail the claim if email fails
        }

        return NextResponse.json({
            success: true,
            message: 'Congratulations! You are one of our first 10 companies!',
            plan: 'pro',
            expires_at: expiresAt.toISOString(),
            spots_remaining: promo.max_claims - promo.current_claims - 1
        });

    } catch (error: any) {
        console.error('Promo claim error:', error);
        return NextResponse.json({ error: error.message || 'Failed to claim promotion' }, { status: 500 });
    }
}

// GET: Check eligibility without claiming
export async function GET(req: NextRequest) {
    try {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get('employer_session');

        if (!sessionCookie?.value) {
            return NextResponse.json({ eligible: false, reason: 'Not logged in' });
        }

        const session = JSON.parse(sessionCookie.value);
        const companyId = session.companyId;

        // Check if already claimed
        const { data: existingClaim } = await supabaseAdmin
            .from('promotion_claims')
            .select('*')
            .eq('promo_code', 'EARLY_EMPLOYER_10')
            .eq('company_id', companyId)
            .single();

        if (existingClaim) {
            return NextResponse.json({
                eligible: false,
                already_claimed: true,
                expires_at: existingClaim.expires_at
            });
        }

        // Check spots remaining
        const { data: promo } = await supabaseAdmin
            .from('promotions')
            .select('*')
            .eq('promo_code', 'EARLY_EMPLOYER_10')
            .eq('is_active', true)
            .single();

        if (!promo) {
            return NextResponse.json({ eligible: false, reason: 'Promotion inactive' });
        }

        const spotsRemaining = promo.max_claims - promo.current_claims;

        return NextResponse.json({
            eligible: spotsRemaining > 0,
            spots_remaining: spotsRemaining,
            plan_granted: promo.plan_granted,
            duration_days: promo.duration_days
        });

    } catch (error: any) {
        console.error('Promo check error:', error);
        return NextResponse.json({ eligible: false, error: error.message });
    }
}
