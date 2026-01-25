import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { decryptData } from '@/lib/security';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const { data: companies, error } = await supabaseAdmin
            .schema('employer')
            .from('companies')
            .select('*');

        if (error) throw error;

        const { data: follows } = await supabaseAdmin
            .schema('professional')
            .from('company_follows')
            .select('user_id, company_id');

        const results = companies.map((c: any) => {
            const name = c.enc_company_name ? decryptData(c.enc_company_name) : null;
            return {
                id: c.id,
                name: name,
                enc_name_preview: c.enc_company_name ? c.enc_company_name.substring(0, 20) + '...' : 'NULL',
                is_decrypted: !!name,
                industry: c.industry
            };
        });

        // Debug: Check which IDs are being followed
        const followDebug = follows?.map((f: any) => ({
            user: f.user_id,
            company: f.company_id,
            isValidCompany: results.some((r: any) => r.id === f.company_id)
        }));

        return NextResponse.json({
            companies: results,
            follows: followDebug
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
