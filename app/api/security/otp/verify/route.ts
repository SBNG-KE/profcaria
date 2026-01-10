//app/api/security/phone/verify/route.ts

import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { jwtVerify, SignJWT } from 'jose';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('profcaria_session')?.value;
        const body = await req.json();
        const { code } = body;

        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Validate Session
        const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);
        let payload;
        try {
            const { payload: verified } = await jwtVerify(token, secretKey);
            payload = verified;
        } catch (e) {
            return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
        }

        // Retrieve OTP from cookie
        const storedOtpCookie = cookieStore.get('auth_otp_temp');

        if (!storedOtpCookie) {
            return NextResponse.json({ error: 'OTP expired or not found' }, { status: 400 });
        }

        if (storedOtpCookie.value !== code) {
            return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });
        }

        const { uid, schema } = payload;
        const table = schema === 'professional' ? 'users' : 'companies';

        // Update DB
        const { error } = await supabaseAdmin
            .schema(schema as string)
            .from(table)
            .update({ has_phone_otp: true })
            .eq('id', uid);

        if (error) throw error;

        // Upgrade Session (AAL 2)
        const newPayload = {
            ...payload,
            has_phone_otp: true,
            aal: 2 // Authentication Assurance Level 2 (2FA Verified)
        };

        const tokenSecret = new TextEncoder().encode(process.env.JWT_SECRET);
        const newToken = await new SignJWT(newPayload)
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('30d')
            .sign(tokenSecret);

        // Clear OTP cookie and set new Session cookie
        // Use provided redirect, or fall back to schema default
        const { redirect } = body;
        const defaultPath = schema === 'professional' ? '/professional/home' : schema === 'employer' ? '/employer/home' : '/';
        const redirectPath = redirect || defaultPath;

        const response = NextResponse.json({ verified: true, redirect: redirectPath });

        response.cookies.delete('auth_otp_temp');
        response.cookies.set('profcaria_session', newToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 24 * 30, // 30 days
            path: '/',
        });

        return response;

    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
