import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/auth-helper';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST - Update last_viewed_followers_at to NOW()
export async function POST(request: NextRequest) {
    try {
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { error } = await supabaseAdmin
            .schema('professional')
            .from('preferences')
            .upsert({
                user_id: user.id,
                last_viewed_followers_at: new Date().toISOString()
            }, { onConflict: 'user_id' });

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error updating viewed time:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
