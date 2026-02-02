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
            // Fallback: Return empty instead of error 500
            return NextResponse.json({
                companies: [],
                professionals: []
            });
        }

        // Shuffle helper
        const shuffle = (array: any[]) => array.sort(() => Math.random() - 0.5);

        // Decrypt Data & Shuffle for Variety
        const companies = shuffle(data.companies || []).map((c: any) => ({
            ...c,
            companyName: decryptData(c.enc_company_name),
            logoUrl: c.enc_logo_url ? decryptData(c.enc_logo_url) : null
        }));

        // Decrypt professional data
        const decryptedProfessionals = shuffle(data.professionals || []).map((p: any) => ({
            ...p,
            firstName: decryptData(p.enc_first_name),
            lastName: decryptData(p.enc_last_name),
            currentRole: p.enc_current_role ? decryptData(p.enc_current_role) : null,
            profileImageUrl: p.enc_profile_image_url ? decryptData(p.enc_profile_image_url) : null
        }));

        // Fetch employment info for each professional
        const professionalsWithEmployment = await Promise.all(
            decryptedProfessionals.map(async (p: any) => {
                // Check for active employment connection
                const { data: connections } = await supabaseAdmin
                    .schema('professional')
                    .from('connections')
                    .select('company_id, status')
                    .eq('user_id', p.id)
                    .in('status', ['accepted', 'hired', 'employed', 'offered'])
                    .limit(1);

                let currentCompany = null;
                if (connections && connections.length > 0) {
                    // Get company name
                    const { data: company } = await supabaseAdmin
                        .schema('employer')
                        .from('companies')
                        .select('enc_company_name')
                        .eq('id', connections[0].company_id)
                        .single();

                    if (company?.enc_company_name) {
                        currentCompany = decryptData(company.enc_company_name);
                    }
                }

                return {
                    ...p,
                    currentCompany
                };
            })
        );

        return NextResponse.json({
            companies,
            professionals: professionalsWithEmployment
        });
    } catch (error) {
        console.error('Recommendation API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
