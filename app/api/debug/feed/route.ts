
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/auth-helper';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const user = await getAuthenticatedUser();
        // 1. Auth Check
        if (!user) {
            return NextResponse.json({ status: 'AUTH_FAILED', message: 'No valid session token found.' }, { status: 401 });
        }

        const debugInfo: any = {
            auth: {
                id: user.id,
                schema: user.schema,
                email: user.email
            },
            checks: {}
        };

        // 2. Profile Existence Check
        if (user.schema === 'professional') {
            const { data: prof, error: profError } = await supabaseAdmin
                .schema('professional')
                .from('users')
                .select('id, email')
                .eq('id', user.id)
                .single();

            debugInfo.checks.professional_user = {
                found: !!prof,
                error: profError ? profError : null
            };
        } else {
            const { data: emp, error: empError } = await supabaseAdmin
                .schema('employer')
                .from('companies')
                .select('id, email')
                .eq('id', user.id)
                .single();

            debugInfo.checks.employer_company = {
                found: !!emp,
                error: empError ? empError : null
            };
        }

        // 3. Feed RPC Check
        // Try calling with explicit NULLs if data missing to see if it runs at all
        const { data: feedData, error: rpcError } = await supabaseAdmin.rpc('get_ranked_feed', {
            p_user_id: user.id,
            p_limit: 5,
            p_offset: 0
        });

        debugInfo.feed = {
            status: rpcError ? 'RPC_FAILED' : 'RPC_SUCCESS',
            count: feedData?.length || 0,
            hasError: !!rpcError,
            errorObj: rpcError,
            sample: feedData ? feedData.slice(0, 2) : null
        };

        // 4. Counts Check (Verify data actually exists in DB)
        const { count: totalPosts } = await supabaseAdmin.schema('professional').from('posts').select('*', { count: 'exact', head: true });
        debugInfo.dbStats = {
            totalProfessionalPosts: totalPosts
        };

        return NextResponse.json(debugInfo);

    } catch (e: any) {
        return NextResponse.json({ status: 'CRITICAL_ERROR', error: e.message, stack: e.stack }, { status: 500 });
    }
}
