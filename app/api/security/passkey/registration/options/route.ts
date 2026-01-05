//app/api/security/passkey/registration/options/route.ts

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { generateRegistrationOptions } from '@simplewebauthn/server';
import { supabaseAdmin } from '@/lib/supabase';
import { jwtVerify } from 'jose';

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
            const verified = await jwtVerify(token, secretKey);
            payload = verified.payload as { uid: string; schema: string; email?: string }; // Assuming we can get email or fetch it
        } catch (e) {
            return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
        }

        const { uid, schema } = payload;

        // Fetch user email/name for the authenticator display
        const { data: user, error } = await supabaseAdmin
            .schema(schema)
            .from(schema === 'professional' ? 'users' : 'companies')
            .select('*') // Get email/name
            .eq('id', uid)
            .single();

        if (error || !user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // For professional, use 'email', for company maybe 'company_name' or 'work_email'?
        // Let's rely on standard fields or fallbacks
        const userName = user.email || user.contact_email || user.company_name || 'User';
        const userDisplayName = user.first_name ? `${user.first_name} ${user.last_name}` : userName;

        // Fetch existing credentials to exclude them (prevent re-registering same device)
        const { data: userCredentials } = await supabaseAdmin
            .from('authenticator_credentials')
            .select('credential_id')
            .eq('user_id', uid);

        const options = await generateRegistrationOptions({
            rpName: 'Profcaria',
            rpID: 'localhost', // TODO: Change for production
            userID: new TextEncoder().encode(uid),
            userName: userName,
            userDisplayName: userDisplayName,
            attestationType: 'none',
            authenticatorSelection: {
                residentKey: 'preferred',
                userVerification: 'preferred',
                authenticatorAttachment: 'platform',
            },
            excludeCredentials: userCredentials?.map((cred: { credential_id: any; }) => ({
                id: cred.credential_id,
                transports: ['internal'], // Optional hint
            })) || [],
        });

        // Save challenger/options to DB or Session? 
        // SimpleWebAuthn says we need to remember the `challenge` to verify later.
        // We can store it in a signed httpOnly cookie to be stateless on server side.

        const response = NextResponse.json(options);

        // Store challenge in a cookie for verification step
        response.cookies.set('reg_challenge', options.challenge, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 5, // 5 minutes
            path: '/',
        });

        return response;

    } catch (error) {
        console.error("Passkey Options Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
