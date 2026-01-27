
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { getProfessionalPlan } from '@/lib/billing';
import { PROFESSIONAL_PLANS } from '@/lib/billing-config';

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

        if (payload.schema !== 'professional') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const userId = payload.uid as string;

        // Fetch Plan Details
        const { plan, subscription } = await getProfessionalPlan(userId);

        return NextResponse.json({
            subscription,
            plan: plan.name.toLowerCase(),
            // Return config for frontend to iterate if needed, or just return keys
            plans: PROFESSIONAL_PLANS
        });

    } catch (error) {
        console.error('Professional Billing API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
