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
        let payload;
        try {
            const { payload: verified } = await jwtVerify(token, secret);
            payload = verified as { uid: string; schema: string };
        } catch (e) {
            return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
        }

        const { uid, schema } = payload;

        // 1. Delete credentials from authenticator_credentials
        const { error: deleteError } = await supabaseAdmin
            .from('authenticator_credentials')
            .delete()
            .eq('user_id', uid);

        if (deleteError) {
            console.error('Passkey DB Delete Error:', deleteError);
            return NextResponse.json({ error: 'Failed to remove passkey credentials' }, { status: 500 });
        }

        // 2. Update User flag
        const { error: updateError } = await supabaseAdmin
            .schema(schema)
            .from(schema === 'professional' ? 'users' : 'companies')
            .update({ has_passkey: false })
            .eq('id', uid);

        if (updateError) {
            console.error('Passkey DB Update Error:', updateError);
            return NextResponse.json({ error: 'Failed to update user status' }, { status: 500 });
        }

        // Log
        const ip = req.headers.get('x-forwarded-for') || 'Unknown IP';
        await supabaseAdmin.schema(schema).from('activity_logs').insert([{
            user_id: uid,
            enc_action: encryptData('MFA_DISABLED_PASSKEY'),
            enc_ip_address: encryptData(ip)
        }]);

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Remove Passkey Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
