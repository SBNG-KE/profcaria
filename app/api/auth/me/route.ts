//app/api/auth/me/route.ts

import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { supabaseAdmin } from '@/lib/supabase';
import { decryptData } from '@/lib/security';

export const runtime = 'nodejs';

export async function GET(req: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('profcaria_session')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);

        let payload;
        try {
            const { payload: verifiedPayload } = await jwtVerify(token, secretKey);
            payload = verifiedPayload;
        } catch (e) {
            return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
        }

        const { uid, schema } = payload;

        // Fetch Security Flags
        const { data: user, error } = await supabaseAdmin
            .schema(schema as string)
            .from(schema === 'professional' ? 'users' : 'companies')
            .select('has_passkey, has_totp, has_phone_otp, requires_2fa, created_at, email_index')
            .eq('id', uid)
            .single();

        if (error || !user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // We don't decrypt email/phone here unless necessary. 
        // Just return flags.

        return NextResponse.json({
            id: uid,
            schema: schema,
            security: {
                hasPasskey: user.has_passkey,
                hasTotp: user.has_totp,
                hasPhone: user.has_phone_otp,
                is2faEnabled: user.requires_2fa
            }
        });

    } catch (error) {
        console.error('Auth Me Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
