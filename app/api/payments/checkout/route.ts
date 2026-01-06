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

        const { plan, amount = 4999 } = await req.json(); // plan code (PLN_...) or amount

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
        const response = await Paystack.initializeTransaction(
            email,
            amount,
            `${origin}/payment/callback`, // Redirect to dedicated callback page
            { companyId },
            plan
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
