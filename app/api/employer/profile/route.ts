
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/auth-helper';
import { decryptData } from '@/lib/security';

// Force Node.js runtime
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
    try {
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (user.schema !== 'employer') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Fetch Employer/Company Profile
        // Assuming user.id corresponds to companies.id
        const { data: company, error } = await supabaseAdmin
            .schema('employer')
            .from('companies')
            .select('id, enc_company_name, enc_logo_url, enc_website, enc_work_email')
            .eq('id', user.id)
            .single();

        if (error) {
            console.error('Error fetching employer profile:', error);
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        const companyName = decryptData(company.enc_company_name) || 'Company';
        const logoUrl = company.enc_logo_url ? decryptData(company.enc_logo_url) : '/default-logo.png';
        const website = company.enc_website ? decryptData(company.enc_website) : '';
        const email = company.enc_work_email ? decryptData(company.enc_work_email) : '';

        const profile = {
            id: company.id,
            name: companyName,
            companyName,
            logoUrl,
            website,
            email,
            type: 'employer'
        };

        // Return as 'profile' to match frontend checks
        return NextResponse.json({ profile });

    } catch (error: any) {
        console.error('Employer Profile API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
