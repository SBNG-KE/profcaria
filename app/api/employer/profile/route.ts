
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/auth-helper';
import { decryptData } from '@/lib/security';

// Force Node.js runtime and disable caching
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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
            .select('id, enc_company_name, enc_logo_url, enc_website, enc_work_email, city, country')
            .eq('id', user.id)
            .single();

        if (error) {
            console.error('Error fetching employer profile:', error);
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        // Fetch latest location from Activity Logs (Dynamic Location)
        const { data: latestLog } = await supabaseAdmin
            .schema('employer')
            .from('activity_logs')
            .select('enc_location_details')
            .eq('company_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        let activityLocation = '';
        if (latestLog && latestLog.enc_location_details) {
            const dec = decryptData(latestLog.enc_location_details);
            if (dec) {
                try {
                    // Try parsing JSON if stored as such
                    const jsonObj = JSON.parse(dec);
                    const parts = [];
                    if (jsonObj.city) parts.push(jsonObj.city);
                    if (jsonObj.country) parts.push(jsonObj.country);
                    activityLocation = parts.join(', ');
                } catch (e) {
                    // Plain string
                    activityLocation = dec;
                }
            }
        }

        const companyName = decryptData(company.enc_company_name) || 'Company';
        const logoUrl = company.enc_logo_url ? decryptData(company.enc_logo_url) : '/default-logo.png';
        const website = company.enc_website ? decryptData(company.enc_website) : '';
        const email = company.enc_work_email ? decryptData(company.enc_work_email) : '';

        // Use Company Profile Location if set, otherwise use latest Activity Log location
        const location = (company.city && company.country ? `${company.city}, ${company.country}` : '') || activityLocation || '';

        const profile = {
            id: company.id,
            name: companyName,
            companyName,
            logoUrl,
            website,
            email,
            location,
            type: 'employer'
        };

        // Return as 'profile' to match frontend checks
        const res = NextResponse.json({ profile });
        res.headers.set('Cache-Control', 'private, max-age=60, stale-while-revalidate=300');
        return res;

    } catch (error: any) {
        console.error('Employer Profile API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
