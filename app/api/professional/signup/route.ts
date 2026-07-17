//app/api/professional/signup/route.ts


import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { encryptData, hashForIndex } from '@/lib/security';
import { checkRateLimit, getClientIdentifier, rateLimitedResponse } from '@/lib/rate-limit';
import * as argon2 from 'argon2';
import { SignJWT } from 'jose';
import { ensureOndwiraAccount } from '@/lib/ondwira-identity';
import { validateOndwiraPhone, validateOndwiraUsername } from '@/lib/ondwira-username';

// Force Node.js runtime for Argon2 support
export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    // Rate Limiting Check (5 signups/minute per IP)
    const clientId = getClientIdentifier(req);
    const rateCheck = await checkRateLimit(clientId, 'signup');
    if (!rateCheck.allowed) {
      return rateLimitedResponse(rateCheck.resetIn);
    }

    const body = await req.json();
    const {
      email,
      password,
      firstName,
      lastName,
      role,
      phoneNumber,
      username: requestedUsername,
      onboardingChannel = 'web',
    } = body;

    // 1. Input Validation
    if (!email || !password || !firstName || !lastName || password.length < 8) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const usernameResult = validateOndwiraUsername(requestedUsername);
    if (!usernameResult.valid) {
      return NextResponse.json({ error: usernameResult.error }, { status: 400 });
    }
    const phoneResult = validateOndwiraPhone(phoneNumber);
    if (!phoneResult.valid) {
      return NextResponse.json({ error: phoneResult.error }, { status: 400 });
    }
    if (onboardingChannel === 'native' && !phoneResult.phone) {
      return NextResponse.json({ error: 'A phone number is required in the mobile app.' }, { status: 400 });
    }

    // 2. Create Blind Indexes (For Lookups)
    // We strictly search by hash, never by plain text to protect identity
    const emailIndex = hashForIndex(email);
    const phoneIndex = phoneResult.phone ? hashForIndex(phoneResult.phone) : null;

    // 3. One email can own only one Ondwira login, including legacy accounts.
    const [{ data: existingUser }, { data: existingCompany }, { data: existingUsername }] = await Promise.all([
      supabaseAdmin.schema('professional').from('users').select('id').eq('email_index', emailIndex).maybeSingle(),
      supabaseAdmin.schema('employer').from('companies').select('id').eq('work_email_index', emailIndex).maybeSingle(),
      supabaseAdmin.schema('ondwira').from('accounts').select('id').eq('username', usernameResult.username).maybeSingle(),
    ]);

    if (existingUser || existingCompany) {
      return NextResponse.json({ error: 'User already exists' }, { status: 409 });
    }
    if (existingUsername) {
      return NextResponse.json({ error: 'That username is already taken.' }, { status: 409 });
    }

    // 4. Hash Password (Argon2id) - The Gold Standard
    const passwordHash = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
    });

    // 5. Encrypt Personal Data (AES-256-GCM)
    // The DB will only see "iv:authTag:encryptedData" strings
    const encFirstName = encryptData(firstName);
    const encLastName = encryptData(lastName);
    const encRole = encryptData(role);

    // Note: Phone is stored as a hash (index) for lookup above. 
    // If you want to display it back to the user later, you should also store an encrypted version.

    // 6. Insert into Supabase (Professional Schema)
    const { data, error } = await supabaseAdmin
      .schema('professional')
      .from('users')
      .insert([
        {
          email_index: emailIndex,
          phone_index: phoneIndex,
          password_hash: passwordHash,
          enc_first_name: encFirstName,
          enc_last_name: encLastName,
          enc_current_role: encRole,
          enc_email: encryptData(email),
          enc_phone_number: phoneResult.phone ? encryptData(phoneResult.phone) : null,
          // Default security
          requires_2fa: false
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Supabase Error:', error);
      throw error;
    }

    try {
      await ensureOndwiraAccount({
        id: data.id,
        identityType: 'professional',
        emailIndex,
        encryptedEmail: data.enc_email,
        displayName: `${firstName || ''} ${lastName || ''}`.trim(),
        username: usernameResult.username,
        phoneIndex,
        encryptedPhone: phoneResult.phone ? encryptData(phoneResult.phone) : null,
        security: { requires2fa: false },
      });
    } catch (accountError: unknown) {
      await supabaseAdmin.schema('professional').from('users').delete().eq('id', data.id);
      if (typeof accountError === 'object' && accountError && 'code' in accountError && accountError.code === '23505') {
        return NextResponse.json({ error: 'That username or phone number is already connected to another account.' }, { status: 409 });
      }
      throw accountError;
    }

    // Early adopters just join and grow naturally — badges earned via followers.

    // Send Welcome Email (non-blocking)
    try {
      const { sendWelcomeEmail } = await import('@/lib/email');
      sendWelcomeEmail(email, firstName, 'professional');
    } catch (emailErr) {
      console.error('Welcome email failed (non-fatal):', emailErr);
    }

    // 7. Generate Session Token (JWT) - 30 Days
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const token = await new SignJWT({ uid: data.id, schema: 'professional', account_id: data.id, aal: 1 })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('30d')
      .sign(secret);

    // 7. Set Cookie & Return
    const has2fa = data.has_totp || data.has_passkey || data.has_phone_otp || data.has_email_otp;
    const redirectPath = has2fa ? '/?mode=verify&redirect=/social' : '/?mode=setup&redirect=/social';
    const response = NextResponse.json({ success: true, user_id: data.id, redirect: redirectPath });

    response.cookies.set('profcaria_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });

    return response;

  } catch (error: unknown) {
    console.error('Professional Signup Error:', error);
    if (typeof error === 'object' && error && 'code' in error && error.code === '23505') {
      return NextResponse.json({ error: 'That email, username, or phone number is already in use.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
