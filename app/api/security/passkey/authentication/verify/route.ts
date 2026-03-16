//app/api/security/passkey/authentication/verify/route.ts

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import { supabaseAdmin } from '@/lib/supabase';
import { SignJWT } from 'jose';

export const runtime = 'nodejs';

export async function POST(req: Request) {
    console.log('🔐 [PASSKEY-VERIFY] Starting verification...');

    try {
        const body = await req.json();
        console.log('🔐 [PASSKEY-VERIFY] Request body received:', JSON.stringify(body, null, 2));

        const cookieStore = await cookies();
        const challenge = cookieStore.get('auth_challenge')?.value;

        console.log('🔐 [PASSKEY-VERIFY] Challenge from cookie:', challenge ? '✓ Present' : '✗ Missing');

        if (!challenge) {
            console.error('🔐 [PASSKEY-VERIFY] Challenge expired or missing');
            return NextResponse.json({ error: 'Challenge expired' }, { status: 400 });
        }

        // 1. Identify User by Credential ID
        const credentialIDBase64 = body.id;
        console.log('🔐 [PASSKEY-VERIFY] Looking up credential ID:', credentialIDBase64?.substring(0, 20) + '...');

        const { data: credential, error } = await supabaseAdmin
            .from('authenticator_credentials')
            .select('*')
            .eq('credential_id', credentialIDBase64)
            .single();

        if (error || !credential) {
            console.error('🔐 [PASSKEY-VERIFY] Credential not found:', error);
            return NextResponse.json({ error: 'Credential not found' }, { status: 400 });
        }

        console.log('🔐 [PASSKEY-VERIFY] Found credential for user:', credential.user_id);
        console.log('🔐 [PASSKEY-VERIFY] Public key length:', credential.credential_public_key?.length || 0);

        // 2. Verify
        console.log('🔐 [PASSKEY-VERIFY] Starting verification with RPID:', process.env.RP_ID || (process.env.NODE_ENV === 'production' ? 'profcaria.com' : 'localhost'));

        const verification = await verifyAuthenticationResponse({
            response: body,
            expectedChallenge: challenge,
            expectedOrigin: process.env.NODE_ENV === 'production'
                ? ['https://profcaria.com', 'https://www.profcaria.com']
                : ['http://localhost:3000'],
            expectedRPID: process.env.RP_ID || (process.env.NODE_ENV === 'production' ? 'profcaria.com' : 'localhost'),
            credential: {
                id: credential.credential_id,
                publicKey: new Uint8Array(Buffer.from(credential.credential_public_key, 'base64url')),
                counter: credential.counter,
                transports: credential.transports ? credential.transports.split(',') as any : [],
            }
        });

        console.log('🔐 [PASSKEY-VERIFY] Verification result:', {
            verified: verification.verified,
            userVerified: verification.authenticationInfo?.userVerified,
            newCounter: verification.authenticationInfo?.newCounter
        });

        if (verification.verified && verification.authenticationInfo) {
            // Update counter in DB
            await supabaseAdmin
                .from('authenticator_credentials')
                .update({
                    counter: verification.authenticationInfo.newCounter,
                    last_used: new Date().toISOString()
                })
                .eq('id', credential.id);

            // 3. Login Successful - Issue Token!
            const secret = new TextEncoder().encode(process.env.JWT_SECRET);
            const token = await new SignJWT({
                uid: credential.user_id,
                schema: credential.user_schema,
                has_totp: true,
                aal: 2
            })
                .setProtectedHeader({ alg: 'HS256' })
                .setIssuedAt()
                .setExpirationTime('30d')
                .sign(secret);

            const redirectPath = credential.user_schema === 'professional' ? '/professional/notifications' :
                credential.user_schema === 'employer' ? '/employer/feed' : '/';

            console.log('🔐 [PASSKEY-VERIFY] Success! Redirecting to:', redirectPath);

            const response = NextResponse.json({
                success: true,
                verified: true,
                redirect: redirectPath
            });

            response.cookies.set('profcaria_session', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 60 * 60 * 24 * 30,
                path: '/',
            });
            response.cookies.delete('auth_challenge');

            return response;
        }

        console.error('🔐 [PASSKEY-VERIFY] Verification failed');
        return NextResponse.json({ error: 'Verification failed' }, { status: 400 });

    } catch (error) {
        console.error("🔐 [PASSKEY-VERIFY] Error:", error);
        return NextResponse.json({
            error: 'Internal Server Error',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}