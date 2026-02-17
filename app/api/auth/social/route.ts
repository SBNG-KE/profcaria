// app/api/auth/social/route.ts
// Handles OAuth user data after Supabase Auth callback.
// Finds or creates user in custom schema, issues profcaria_session JWT.

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { encryptData, hashForIndex } from '@/lib/security';
import { SignJWT } from 'jose';

export const runtime = 'nodejs';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {
            email,
            fullName,
            provider,     // 'google' | 'azure' | 'apple'
            providerId,   // Provider's unique user ID
            role          // 'professional' | 'employer'
        } = body;

        if (!email || !provider || !providerId || !role) {
            return NextResponse.json({ error: 'Missing required OAuth data' }, { status: 400 });
        }

        const emailIndex = hashForIndex(email);

        // ==========================================
        // PROFESSIONAL FLOW
        // ==========================================
        if (role === 'professional') {
            // Check if user already exists
            const { data: existingUser } = await supabaseAdmin
                .schema('professional')
                .from('users')
                .select('*')
                .eq('email_index', emailIndex)
                .single();

            if (existingUser) {
                // LOGIN: Existing user — update OAuth info if not set
                if (!existingUser.oauth_provider) {
                    await supabaseAdmin
                        .schema('professional')
                        .from('users')
                        .update({
                            oauth_provider: provider,
                            oauth_provider_id: providerId,
                            last_login: new Date().toISOString()
                        })
                        .eq('id', existingUser.id);
                } else {
                    await supabaseAdmin
                        .schema('professional')
                        .from('users')
                        .update({ last_login: new Date().toISOString() })
                        .eq('id', existingUser.id);
                }

                // Issue session
                const token = await issueToken(existingUser.id, 'professional', existingUser.has_totp || false);
                const has2fa = existingUser.has_totp || existingUser.has_passkey || existingUser.has_email_otp;
                // Direct to homepage mode to avoid redirects
                const redirectPath = has2fa
                    ? `/?mode=verify&redirect=${encodeURIComponent('/professional/feed')}`
                    : '/professional/feed';

                const response = NextResponse.json({ success: true, redirect: redirectPath });
                setSessionCookie(response, token);
                return response;
            }

            // SIGNUP: New professional user
            const nameParts = (fullName || '').split(' ');
            const firstName = nameParts[0] || 'User';
            const lastName = nameParts.slice(1).join(' ') || '';

            const { data: newUser, error } = await supabaseAdmin
                .schema('professional')
                .from('users')
                .insert([{
                    email_index: emailIndex,
                    phone_index: null,
                    password_hash: null, // OAuth user — no password
                    enc_first_name: encryptData(firstName),
                    enc_last_name: encryptData(lastName),
                    enc_current_role: encryptData('User'),
                    enc_email: encryptData(email),
                    enc_phone_number: null,
                    oauth_provider: provider,
                    oauth_provider_id: providerId,
                    requires_2fa: false
                }])
                .select()
                .single();

            if (error || !newUser) {
                console.error('OAuth Professional Signup Error:', error);
                return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
            }

            // Early Adopter Promo (same logic as normal signup)
            try {
                const { count } = await supabaseAdmin
                    .schema('professional')
                    .from('users')
                    .select('*', { count: 'exact', head: true });

                if (count !== null && count <= 500) {
                    await supabaseAdmin
                        .schema('professional')
                        .from('subscriptions')
                        .insert({
                            user_id: newUser.id,
                            plan_type: 'premium',
                            status: 'active',
                            is_promo: true,
                            current_period_start: new Date().toISOString(),
                            current_period_end: new Date(Date.now() + 1000 * 60 * 60 * 24 * 60).toISOString(),
                        });

                    await supabaseAdmin
                        .schema('professional')
                        .from('users')
                        .update({ badge_type: 'gold' })
                        .eq('id', newUser.id);
                }
            } catch (promoError) {
                console.error('OAuth Promo Error (Non-Fatal):', promoError);
            }

            // Send Welcome Email (non-blocking)
            try {
                const { sendWelcomeEmail } = await import('@/lib/email');
                sendWelcomeEmail(email, firstName, 'professional');
            } catch (emailErr) {
                console.error('Welcome email failed (non-fatal):', emailErr);
            }

            const token = await issueToken(newUser.id, 'professional', false);
            // New user needs security setup
            const response = NextResponse.json({ success: true, redirect: '/?mode=setup' });
            setSessionCookie(response, token);
            return response;
        }

        // ==========================================
        // EMPLOYER FLOW
        // ==========================================
        if (role === 'employer') {
            // Check if company already exists with this email
            const { data: existingCompany } = await supabaseAdmin
                .schema('employer')
                .from('companies')
                .select('*')
                .eq('work_email_index', emailIndex)
                .single();

            if (existingCompany) {
                // LOGIN: Existing employer
                if (!existingCompany.oauth_provider) {
                    await supabaseAdmin
                        .schema('employer')
                        .from('companies')
                        .update({
                            oauth_provider: provider,
                            oauth_provider_id: providerId,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', existingCompany.id);
                } else {
                    await supabaseAdmin
                        .schema('employer')
                        .from('companies')
                        .update({ updated_at: new Date().toISOString() })
                        .eq('id', existingCompany.id);
                }

                const token = await issueToken(existingCompany.id, 'employer', existingCompany.has_totp || false);
                const has2fa = existingCompany.has_totp || existingCompany.has_passkey || existingCompany.has_phone_otp;
                // Direct to homepage mode
                const redirectPath = has2fa
                    ? `/?mode=verify&redirect=${encodeURIComponent('/employer/feed')}`
                    : '/employer/feed';

                const response = NextResponse.json({ success: true, redirect: redirectPath });
                setSessionCookie(response, token);
                return response;
            }

            // SIGNUP: New employer — need company name + industry
            const { companyName, industry } = body;

            if (!companyName) {
                // Signal to callback page: need more info
                return NextResponse.json({
                    needsCompletion: true,
                    message: 'Company name and industry required for employer signup'
                }, { status: 200 });
            }

            const companyNameIndex = hashForIndex(companyName);

            // Check if company name already taken
            const { data: existingName } = await supabaseAdmin
                .schema('employer')
                .from('companies')
                .select('id')
                .eq('company_name_index', companyNameIndex)
                .single();

            if (existingName) {
                return NextResponse.json({ error: 'Company name already registered' }, { status: 409 });
            }

            const { data: newCompany, error } = await supabaseAdmin
                .schema('employer')
                .from('companies')
                .insert([{
                    work_email_index: emailIndex,
                    company_name_index: companyNameIndex,
                    phone_index: null,
                    password_hash: null, // OAuth user — no password
                    enc_company_name: encryptData(companyName),
                    enc_logo_url: null,
                    enc_work_email: encryptData(email),
                    enc_phone_number: null,
                    oauth_provider: provider,
                    oauth_provider_id: providerId,
                    industry: industry || null,
                    requires_2fa: true,
                    allow_passkeys: true
                }])
                .select()
                .single();

            if (error || !newCompany) {
                console.error('OAuth Employer Signup Error:', error);
                return NextResponse.json({ error: 'Failed to create company account' }, { status: 500 });
            }

            // Send Welcome Email (non-blocking)
            try {
                const { sendWelcomeEmail } = await import('@/lib/email');
                sendWelcomeEmail(email, companyName, 'employer');
            } catch (emailErr) {
                console.error('Welcome email failed (non-fatal):', emailErr);
            }

            const token = await issueToken(newCompany.id, 'employer', false);
            // New employer needs security setup
            const response = NextResponse.json({ success: true, redirect: '/?mode=setup' });
            setSessionCookie(response, token);
            return response;
        }

        return NextResponse.json({ error: 'Invalid role' }, { status: 400 });

    } catch (error) {
        console.error('Social Auth Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// --- Helper: Issue JWT ---
async function issueToken(userId: string, schema: string, hasTotp: boolean): Promise<string> {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    return new SignJWT({
        uid: userId,
        schema,
        has_totp: hasTotp,
        aal: 1
    })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('30d')
        .sign(secret);
}

// --- Helper: Set Session Cookie ---
function setSessionCookie(response: NextResponse, token: string) {
    response.cookies.set('profcaria_session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
        expires: new Date(Date.now() + 60 * 60 * 24 * 30 * 1000),
        path: '/',
    });
}
