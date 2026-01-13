import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
    try {
        // Import billing config (reads from environment variables)
        const { BILLING_PLANS } = await import('@/lib/billing-config');

        return NextResponse.json({
            basic: BILLING_PLANS.basic.priceMonthly,
            basicOffer: BILLING_PLANS.basic.priceMonthlyOffer,
            pro: BILLING_PLANS.pro.priceMonthly,
            proOffer: BILLING_PLANS.pro.priceMonthlyOffer,
            enterprise: BILLING_PLANS.enterprise.priceMonthly,
            enterpriseOffer: BILLING_PLANS.enterprise.priceMonthlyOffer,
        });

    } catch (error) {
        console.error('Pricing API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
