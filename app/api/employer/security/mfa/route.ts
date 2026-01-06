import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { encryptData } from '@/lib/security';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

export const runtime = 'nodejs';

export async function POST(req: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('profcaria_session')?.value;

        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        const userId = payload.uid as string;

        const { action, method } = await req.json();

        if (action === 'disable') {
            const updates: any = {};
            let logAction = '';

            if (method === 'totp') {
                updates.has_totp = false;
                logAction = 'MFA_DISABLED_TOTP';
            } else if (method === 'passkey') {
                updates.has_passkey = false;
                logAction = 'MFA_DISABLED_PASSKEY';
            } else {
                return NextResponse.json({ error: 'Unsupported method' }, { status: 400 });
            }

            await supabaseAdmin
                .schema('employer')
                .from('companies')
                .update(updates)
                .eq('id', userId);

            const ip = req.headers.get('x-forwarded-for') || 'Unknown IP';
            await supabaseAdmin.schema('employer').from('activity_logs').insert([{
                user_id: userId,
                enc_action: encryptData(logAction),
                enc_ip_address: encryptData(ip)
            }]);

            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });

    } catch (error) {
        console.error('MFA API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
