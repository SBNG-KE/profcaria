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

        const { action, method } = await req.json(); // e.g. action='disable', method='totp'

        if (action === 'disable' && method === 'totp') {
            // Disable TOTP
            await supabaseAdmin
                .schema('professional')
                .from('users')
                .update({ has_totp: false })
                .eq('id', userId);

            // Log
            const ip = req.headers.get('x-forwarded-for') || 'Unknown IP';
            await supabaseAdmin.schema('professional').from('activity_logs').insert([{
                user_id: userId,
                enc_action: encryptData('MFA_DISABLED_TOTP'),
                enc_ip_address: encryptData(ip)
            }]);

            return NextResponse.json({ success: true });
        }

        if (action === 'disable' && method === 'passkey') {
            // Disable Passkey
            await supabaseAdmin
                .schema('professional')
                .from('users')
                .update({ has_passkey: false })
                .eq('id', userId);

            // Log
            const ip = req.headers.get('x-forwarded-for') || 'Unknown IP';
            await supabaseAdmin.schema('professional').from('activity_logs').insert([{
                user_id: userId,
                enc_action: encryptData('MFA_DISABLED_PASSKEY'),
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
