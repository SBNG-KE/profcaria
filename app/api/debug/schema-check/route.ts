
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Inspect one row from employer.post_reposts to see columns
        const { data: employerRepost, error: empError } = await supabaseAdmin
            .schema('employer')
            .from('post_reposts')
            .select('*')
            .limit(1);

        // Inspect one row from professional.post_reposts
        const { data: profRepost, error: profError } = await supabaseAdmin
            .schema('professional')
            .from('post_reposts')
            .select('*')
            .limit(1);

        return NextResponse.json({
            employer: {
                data: employerRepost,
                error: empError
            },
            professional: {
                data: profRepost,
                error: profError
            }
        });

    } catch (e: any) {
        return NextResponse.json({ error: e.message });
    }
}
