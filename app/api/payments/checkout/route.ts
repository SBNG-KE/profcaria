import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { Paystack } from '@/lib/paystack';
import { encryptData, decryptData, hashForIndex } from '@/lib/security';

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

export async function POST(req: Request) {
    try {
        const companyId = await getEmployerId();
        if (!companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { plan } = await req.json(); // plan: 'basic' | 'pro' | 'enterprise'

        let exchangeRate = parseFloat(process.env.USD_EXCHANGE_RATE || '1');
        const merchantCurrency = process.env.MERCHANT_CURRENCY; // e.g., 'KES', 'NGN'

        // Fetch live rate only if a specific merchant currency is defined and not USD
        if (merchantCurrency && merchantCurrency !== 'USD') {
            try {
                const res = await fetch(`https://api.exchangerate-api.com/v4/latest/USD`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.rates[merchantCurrency]) {
                        exchangeRate = data.rates[merchantCurrency];
                    }
                }
            } catch (error) {
                console.error('Failed to fetch live backend rate, falling back to static env var:', error);
            }
        }

        // Base Prices (Monthly USD)
        // Base Prices (Monthly USD) & Offers
        const getPrice = (plan: string) => {
            const basicMo = parseFloat(process.env.PRICE_BASIC_MONTHLY || '25');
            const basicOffer = parseFloat(process.env.PRICE_BASIC_MONTHLY_OFFER || '0');
            const proMo = parseFloat(process.env.PRICE_PRO_MONTHLY || '99');
            const proOffer = parseFloat(process.env.PRICE_PRO_MONTHLY_OFFER || '0');
            const entMo = parseFloat(process.env.PRICE_ENTERPRISE_MONTHLY || '250');
            const entOffer = parseFloat(process.env.PRICE_ENTERPRISE_MONTHLY_OFFER || '0');

            switch (plan) {
                case 'basic': return basicOffer > 0 ? basicOffer : basicMo;
                case 'pro': return proOffer > 0 ? proOffer : proMo;
                case 'enterprise': return entOffer > 0 ? entOffer : entMo;
                default: return undefined;
            }
        };

        const planPrice = getPrice(plan);

        if (planPrice === undefined) {
            return NextResponse.json({ error: 'Invalid plan selected' }, { status: 400 });
        }
        // Calculate amount in correct currency
        const amountUSD = planPrice;

        // No more yearly discount logic - relying on direct Offer Prices from env

        // Convert to Display Units (e.g. 25.00 or 3225.00)
        // Paystack initializes with "Display Amount", library handles *100 if needed
        const displayAmount = amountUSD * exchangeRate;
        const finalDisplayAmount = Math.round(displayAmount * 100) / 100;

        // 1. Fetch Company Details
        const { data: company } = await supabaseAdmin
            .schema('employer')
            .from('companies')
            .select('*')
            .eq('id', companyId)
            .single();

        if (!company) {
            return NextResponse.json({ error: 'Company not found' }, { status: 404 });
        }

        const email = await decryptData(company.enc_work_email);

        if (!email) {
            return NextResponse.json({ error: 'Could not decrypt company email' }, { status: 400 });
        }

        // 2. Determine Callback URL
        // Use the request origin (what the user is visiting) to ensure we redirect back to the correct domain.
        const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'https://profcaria.com';

        // 3. Initialize Paystack Transaction
        // Pass "amount" directly because we already calculated it in cents/kobo above.
        // We need to slightly adjust the Paystack.initializeTransaction signature or usage 
        // because it multiplies by 100 inside.
        // Let's modify usage here to pass the raw value and adjust the lib if needed, 
        // OR easier: Divide by 100 here so the lib multiplies it back, 
        // BUT the lib might be used elsewhere. 
        // Let's check lib/paystack.ts content again. 
        // Line 5: amount: amount * 100. 
        // So we should pass the "Display Amount" (e.g. 3225) and let lib turn it into 322500 cents.

        // 3. Initialize Paystack Transaction
        // Check if a Paystack Plan Code exists for this selection (Enables Auto-Renew)
        // Always MONTHLY now.
        const envPlanKey = `PAYSTACK_PLAN_${plan.toUpperCase()}_MONTHLY`;
        const paystackPlanCode = process.env[envPlanKey];

        const response = await Paystack.initializeTransaction(
            email,
            finalDisplayAmount,
            `${origin}/payment/callback`,
            { companyId, plan, billingCycle: 'monthly' },
            paystackPlanCode
        );

        if (!response.status) {
            return NextResponse.json({ error: 'Paystack Init Failed: ' + response.message }, { status: 400 });
        }

        // Return the authorization URL to frontend
        return NextResponse.json({ url: response.data.authorization_url });

    } catch (error) {
        console.error('Checkout Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
