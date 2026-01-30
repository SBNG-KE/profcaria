
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // 1. Check if table exists and is accessible
        const { data: testSelect, error: selectError } = await supabaseAdmin
            .schema('public')
            .from('saved_posts')
            .select('count')
            .limit(1);

        if (selectError) {
            return NextResponse.json({
                step: 'SELECT_CHECK',
                status: 'FAILED',
                error: selectError,
                details: 'Service Role cannot read table. Permission or existence issue.'
            }, { status: 500 });
        }

        // 2. Introspect Table Structure (if possible via RPC, or just return success if select worked)
        // Since we can't easily introspect without SQL, we'll assume structure is roughly ok if select worked.

        return NextResponse.json({
            step: 'SELECT_CHECK',
            status: 'SUCCESS',
            data: testSelect,
            message: 'Table exists and is readable by Service Role.'
        });

    } catch (error: any) {
        return NextResponse.json({
            step: 'CRITICAL_FAILURE',
            error: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
