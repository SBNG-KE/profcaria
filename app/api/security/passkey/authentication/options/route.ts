//app/api/security/passkey/authentication/options/route.ts

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { supabaseAdmin } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function POST() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('profcaria_session')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secretKey);

        const { uid, schema } = payload as { uid: string; schema: string };

        // Fetch allowed credentials
        const { data: creds, error } = await supabaseAdmin
            .from('authenticator_credentials')
            .select('credential_id, transports')
            .eq('user_id', uid);

        if (error) {
            console.error(error);
            return NextResponse.json({ error: 'Failed to load credentials' }, { status: 500 });
        }

        const allowCredentials = creds?.map((c: { credential_id: any; transports: string; }) => ({
            id: c.credential_id,
            transports: c.transports ? c.transports.split(',') : undefined,
        }));

        const options = await generateAuthenticationOptions({
            rpID: process.env.RP_ID || (process.env.NODE_ENV === 'production' ? 'profcaria.com' : 'localhost'),
            allowCredentials,
            userVerification: 'preferred',
        });

        const response = NextResponse.json(options);

        response.cookies.set('auth_challenge', options.challenge, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 5,
            path: '/',
        });

        return response;

    } catch (err) {
        console.error('Passkey Options Error:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
