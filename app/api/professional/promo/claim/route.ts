import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';

// API to check and apply early adopter promotion for professionals
export async function POST(req: NextRequest) {
    try {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get('profcaria_session');

        if (!sessionCookie?.value) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const session = JSON.parse(sessionCookie.value);
        const userId = session.userId;

        if (!userId) {
            return NextResponse.json({ error: 'User not found' }, { status: 400 });
        }

        // Check if user already has an active subscription
        const { data: existingSub } = await supabaseAdmin
            .schema('professional')
            .from('subscriptions')
            .select('*')
            .eq('user_id', userId)
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
            .eq('promo_code', 'EARLY_PROFESSIONAL_500')
            .eq('user_id', userId)
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
            .eq('promo_code', 'EARLY_PROFESSIONAL_500')
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
                reason: 'Promotion limit reached (500 users)',
                spots_remaining: 0
            });
        }

        // Calculate expiry (2 months = 60 days)
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + promo.duration_days);

        // Start transaction: claim promo and create subscription
        // 1. Increment promo claims
        await supabaseAdmin
            .from('promotions')
            .update({ current_claims: promo.current_claims + 1 })
            .eq('promo_code', 'EARLY_PROFESSIONAL_500');

        // 2. Record the claim
        await supabaseAdmin
            .from('promotion_claims')
            .insert({
                promo_code: 'EARLY_PROFESSIONAL_500',
                user_id: userId,
                expires_at: expiresAt.toISOString()
            });

        // 3. Create or update subscription to premium
        if (existingSub) {
            await supabaseAdmin
                .schema('professional')
                .from('subscriptions')
                .update({
                    plan_type: 'premium',
                    status: 'active',
                    is_promo: true,
                    promo_type: 'early_adopter_professional',
                    promo_expires_at: expiresAt.toISOString(),
                    current_period_end: expiresAt.toISOString()
                })
                .eq('id', existingSub.id);
        } else {
            await supabaseAdmin
                .schema('professional')
                .from('subscriptions')
                .insert({
                    user_id: userId,
                    plan_type: 'premium',
                    status: 'active',
                    is_promo: true,
                    promo_type: 'early_adopter_professional',
                    promo_expires_at: expiresAt.toISOString(),
                    current_period_start: new Date().toISOString(),
                    current_period_end: expiresAt.toISOString()
                });
        }

        // 4. Update user's badge_type to 'gold' for premium
        await supabaseAdmin
            .schema('professional')
            .from('users')
            .update({ badge_type: 'gold' })
            .eq('id', userId);

        return NextResponse.json({
            success: true,
            message: 'Congratulations! You are one of our first 500 users!',
            plan: 'premium',
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
        const sessionCookie = cookieStore.get('profcaria_session');

        if (!sessionCookie?.value) {
            return NextResponse.json({ eligible: false, reason: 'Not logged in' });
        }

        const session = JSON.parse(sessionCookie.value);
        const userId = session.userId;

        // Check if already claimed
        const { data: existingClaim } = await supabaseAdmin
            .from('promotion_claims')
            .select('*')
            .eq('promo_code', 'EARLY_PROFESSIONAL_500')
            .eq('user_id', userId)
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
            .eq('promo_code', 'EARLY_PROFESSIONAL_500')
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
