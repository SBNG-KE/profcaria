
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { getCompanyPlan } from '@/lib/billing';

export const runtime = 'nodejs';

export async function GET(req: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('profcaria_session')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        let payload;
        try {
            const { payload: p } = await jwtVerify(token, secret);
            payload = p;
        } catch {
            return NextResponse.json({ error: 'Invalid Session' }, { status: 401 });
        }

        if (payload.schema !== 'employer') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const companyId = payload.uid as string;

        // Fetch Plan Details using our robust helper
        const { plan, subscription } = await getCompanyPlan(companyId);

        // Also fetch pricing config to return to frontend
        const { BILLING_PLANS } = await import('@/lib/billing-config');

        return NextResponse.json({
            subscription,
            plan: plan.name.toLowerCase(), // 'basic', 'pro', etc.

            // Return base pricing from config so frontend relies on single source of truth
            basic: BILLING_PLANS.basic.priceMonthly,
            pro: BILLING_PLANS.pro.priceMonthly,
            enterprise: BILLING_PLANS.enterprise.priceMonthly,
            yearlyDiscountPercent: parseFloat(process.env.YEARLY_DISCOUNT_PERCENT || '20')
        });

    } catch (error) {
        console.error('Billing API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
