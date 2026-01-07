import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

export const runtime = 'nodejs';

async function getEmployerId() {
    const cookieStore = await cookies();
    const token = cookieStore.get('profcaria_session')?.value;
    if (!token) return null;
    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        if (payload.schema !== 'employer') return null;
        return payload.uid as string;
    } catch {
        return null;
    }
}

export async function GET(req: Request) {
    try {
        const companyId = await getEmployerId();
        if (!companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch Subscription
        const { data: subscription } = await supabaseAdmin
            .schema('employer')
            .from('subscriptions')
            .select('*')
            .eq('company_id', companyId)
            .single();

        // Fetch Recent Payments (Invoices)
        const { data: payments } = await supabaseAdmin
            .schema('employer')
            .from('payments')
            .select('*')
            .eq('company_id', companyId)
            .order('created_at', { ascending: false })
            .limit(10);

        // Pricing Configuration (Read from Env or Defaults)
        // Basic: $25, Pro: $99, Enterprise: $250
        const pricingConfig = {
            exchangeRate: parseFloat(process.env.USD_EXCHANGE_RATE || '1'),
            basic: parseFloat(process.env.PRICE_BASIC_MONTHLY || '25'),
            pro: parseFloat(process.env.PRICE_PRO_MONTHLY || '99'),
            enterprise: parseFloat(process.env.PRICE_ENTERPRISE_MONTHLY || '250'),
            yearlyDiscountPercent: parseFloat(process.env.YEARLY_DISCOUNT_PERCENT || '20')
        };

        return NextResponse.json({
            subscription: subscription || null,
            payments: payments || [],
            ...pricingConfig
        });

    } catch (error) {
        console.error('Billing Fetch Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
