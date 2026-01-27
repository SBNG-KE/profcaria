import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/auth-helper';
import { decryptData } from '@/lib/security';

export const runtime = 'nodejs';

export async function GET() {
    try {
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data, error } = await supabaseAdmin.rpc('get_smart_recommendations', {
            p_user_id: user.id
        });

        if (error) {
            console.error('Growth Engine Error:', error);
            return NextResponse.json({
                companies: [],
                professionals: [],
                error: 'Failed to generate recommendations'
            });
        }

        // Decrypt Data
        const companies = (data.companies || []).map((c: any) => ({
            ...c,
            // Decrypt known fields, keep original enc_ for reference if needed (but frontend uses enc_ names in my code? I should fix frontend too)
            // Actually, frontend I wrote uses `enc_company_name`. 
            // If I decrypt here, I should probably expose them as `companyName` etc.
            // AND the frontend code I just wrote used `item.data.enc_company_name`.
            // So I should just decrypt it AND REPLACE the value? Or provide a new field?
            // "enc_X" implies encrypted. 
            // Let's decrypt into the SAME field to avoid changing frontend massively OR provide new fields.
            // Wait, if frontend shows `{item.data.enc_company_name}`, it expects the value there.
            // If I decrypt `enc_company_name` -> "Google", then `item.data.enc_company_name` will be "Google". 
            // This is semantically weird (variable named enc_ having plain text).
            // But efficient. 
            // Better: Decrypt to `companyName` and update frontend to use `companyName`.

            companyName: decryptData(c.enc_company_name),
            logoUrl: c.enc_logo_url ? decryptData(c.enc_logo_url) : null
        }));

        const professionals = (data.professionals || []).map((p: any) => ({
            ...p,
            firstName: decryptData(p.enc_first_name),
            lastName: decryptData(p.enc_last_name),
            currentRole: p.enc_current_role ? decryptData(p.enc_current_role) : null,
            profileImageUrl: p.enc_profile_image_url ? decryptData(p.enc_profile_image_url) : null
        }));

        return NextResponse.json({
            companies,
            professionals
        });
    } catch (error) {
        console.error('Recommendation API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
