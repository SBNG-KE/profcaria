//app/api/security/totp/verify/route.ts

import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { jwtVerify, SignJWT } from 'jose';
import { authenticator } from 'otplib';
import { supabaseAdmin } from '@/lib/supabase';
import { decryptData } from '@/lib/security';

export const runtime = 'nodejs';

export async function POST(req: Request) {
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

        const { uid, schema } = payload as { uid: string; schema: string };
        const body = await req.json();
        const { code } = body;

        // 1. Fetch encrypted secret from DB
        const { data: user, error } = await supabaseAdmin
            .schema(schema as string)
            .from(schema === 'professional' ? 'users' : 'companies')
            .select('two_factor_secret')
            .eq('id', uid)
            .single();

        if (error || !user || !user.two_factor_secret) {
            return NextResponse.json({ error: 'Setup not started' }, { status: 400 });
        }

        // 2. Decrypt Secret
        const secret = decryptData(user.two_factor_secret);
        if (!secret) {
            return NextResponse.json({ error: 'Decryption failed' }, { status: 500 });
        }

        // 3. Verify Code
        const isValid = authenticator.check(code, secret);

        if (!isValid) {
            return NextResponse.json({ error: 'Invalid code' }, { status: 400 });
        }

        // 4. Enable 2FA
        const { error: updateError } = await supabaseAdmin
            .schema(schema as string)
            .from(schema === 'professional' ? 'users' : 'companies')
            .update({
                has_totp: true,
                requires_2fa: true
            })
            .eq('id', uid);

        if (updateError) {
            return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
        }

        // 5. Upgrade Session (AAL 2)
        const newPayload = {
            ...payload,
            has_totp: true,
            aal: 2 // Authentication Assurance Level 2 (2FA Verified)
        };
        // Remove exp/iat/nbf if they exist in payload to let SignJWT handle them, OR keep them if we want to extend session?
        // Let's create a fresh token with same expiration logic or just 30d

        const tokenSecret = new TextEncoder().encode(process.env.JWT_SECRET);
        const newToken = await new SignJWT(newPayload)
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('30d')
            .sign(tokenSecret);

        const redirectPath = schema === 'professional' ? '/professional/feed' :
            schema === 'employer' ? '/employer/feed' : '/';

        const response = NextResponse.json({ success: true, redirect: redirectPath });
        response.cookies.set('profcaria_session', newToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 24 * 30, // 30 days
            path: '/',
        });

        return response;

    } catch (error) {
        console.error('TOTP Verify Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
