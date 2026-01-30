
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/auth-helper';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const user = await getAuthenticatedUser();
        if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

        // Call the RPC directly
        const { data, error } = await supabaseAdmin.rpc('get_ranked_feed', {
            p_user_id: user.id,
            p_limit: 10,
            p_offset: 0
        });

        if (error) {
            return NextResponse.json({
                status: 'RPC_ERROR',
                error: error,
                message: 'The SQL function failed.'
            });
        }

        return NextResponse.json({
            status: 'SUCCESS',
            count: data?.length || 0,
            data: data
        });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
