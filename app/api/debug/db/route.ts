//app/api/debug/db/route.ts

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function GET() {
    try {
        // 1. Check if we can connect at all (list buckets or something simple, or just health check)
        // But let's go straight to the table.
        const { data: list, error: listError } = await supabaseAdmin
            .from('authenticator_credentials')
            .select('count')
            .limit(1);

        // Log the URL used
        console.log("Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);

        if (listError) {
            return NextResponse.json({
                step: 'select',
                code: listError.code,
                message: listError.message,
                details: listError.details,
                hint: listError.hint
            }, { status: 500 });
        }

        // 2. Try simple insert? Maybe too risky if we don't clean up.
        // Let's just return success if select worked.
        return NextResponse.json({ success: true, count: list });

    } catch (e: any) {
        return NextResponse.json({ error: e.message, stack: e.stack }, { status: 500 });
    }
}
