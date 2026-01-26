import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/auth-helper';

export const runtime = 'edge';

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
            // Return empty structure on failure
            return NextResponse.json({
                companies: [],
                professionals: [],
                error: 'Failed to generate recommendations'
            });
        }

        return NextResponse.json(data); // Expecting { companies: [], professionals: [] } logic from RPC
    } catch (error) {
        console.error('Recommendation API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
