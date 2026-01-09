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

        // Disable TOTP
        const { error } = await supabaseAdmin
            .schema(schema)
            .from(schema === 'professional' ? 'users' : 'companies')
            .update({
                has_totp: false,
                two_factor_secret: null
            })
            .eq('id', uid);

        if (error) {
            console.error('DB Error:', error);
            return NextResponse.json({ error: 'Failed to remove TOTP' }, { status: 500 });
        }

        // Log
        const ip = req.headers.get('x-forwarded-for') || 'Unknown IP';
        await supabaseAdmin.schema(schema).from('activity_logs').insert([{
            user_id: uid,
            enc_action: encryptData('MFA_DISABLED_TOTP'),
            enc_ip_address: encryptData(ip)
        }]);

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Remove TOTP Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
