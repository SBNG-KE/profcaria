import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
    const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    let dbStatus = 'Unknown';
    let dbError = null;

    try {
        // Try to query the new column explicitly
        const { data, error } = await supabaseAdmin
            .schema('employer')
            .from('post_comments')
            .select('company_id')
            .limit(1);

        if (error) {
            dbStatus = 'Error';
            dbError = error;
        } else {
            dbStatus = 'Success - Column Found';
        }
    } catch (e: any) {
        dbStatus = 'Exception';
        dbError = e.message;
    }

    return NextResponse.json({
        environment: {
            NEXT_PUBLIC_SUPABASE_URL: envUrl,
        },
        database_check: {
            status: dbStatus,
            error: dbError,
            message: "If status is Error with code PGRST204, the Schema Cache is stale. If 'Column does not exist', migration wasn't run."
        }
    });
}
