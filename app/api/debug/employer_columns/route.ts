import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const { data: companies, error: companyError } = await supabaseAdmin
            .schema('employer')
            .from('companies')
            .select('*')
            .limit(1);

        return NextResponse.json({
            companies: {
                columns: companies?.[0] ? Object.keys(companies[0]) : [],
                sample: companies?.[0]
            }
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
