// app/api/tos/route.ts
// Handles Terms of Service acceptance/rejection and status checks

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/auth-helper';

export const runtime = 'nodejs';

const CURRENT_TOS_VERSION = '1.0';

// GET: Check if the current user has accepted the latest ToS
export async function GET() {
    try {
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const schema = user.schema; // 'professional' or 'employer'
        const tableName = schema === 'employer' ? 'companies' : 'users';

        // Check tos_status on the user record
        const { data, error } = await supabaseAdmin
            .schema(schema)
            .from(tableName)
            .select('tos_status')
            .eq('id', user.id)
            .single();

        if (error || !data) {
            return NextResponse.json({ accepted: false, banned: false });
        }

        if (data.tos_status === 'rejected') {
            return NextResponse.json({ accepted: false, banned: true });
        }

        if (data.tos_status === 'accepted') {
            return NextResponse.json({ accepted: true, banned: false });
        }

        // null = never accepted
        return NextResponse.json({ accepted: false, banned: false });

    } catch (err) {
        console.error('ToS Status Error:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// POST: Accept or reject ToS
export async function POST(req: Request) {
    try {
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { action } = body; // 'accept' or 'reject'

        if (!action || !['accept', 'reject'].includes(action)) {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        const schema = user.schema;
        const tableName = schema === 'employer' ? 'companies' : 'users';
        const status = action === 'accept' ? 'accepted' : 'rejected';
        const userAgent = req.headers.get('user-agent') || 'Unknown';
        const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';

        // 1. Log the consent/rejection in tos_consents
        await supabaseAdmin
            .from('tos_consents')
            .insert({
                user_id: user.id,
                user_schema: schema,
                tos_version: CURRENT_TOS_VERSION,
                status,
                ip_address: ip,
                user_agent: userAgent
            });

        // 2. Update tos_status on the user record
        await supabaseAdmin
            .schema(schema)
            .from(tableName)
            .update({ tos_status: status })
            .eq('id', user.id);

        // 3. If rejected → delete session cookie (force logout)
        if (action === 'reject') {
            const response = NextResponse.json({
                success: true,
                banned: true,
                message: 'Your account has been permanently suspended. You declined the Terms of Service.'
            });
            response.cookies.delete('profcaria_session');
            return response;
        }

        // 4. Accepted
        return NextResponse.json({ success: true, accepted: true });

    } catch (err) {
        console.error('ToS Action Error:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
