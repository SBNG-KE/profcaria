//app/api/professional/login/route.ts

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { hashForIndex } from '@/lib/security';
import * as argon2 from 'argon2';
import { SignJWT } from 'jose';

// Force Node.js runtime for Argon2 support
export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    // 1. Validation
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    // 2. Derive Blind Index from Email
    // We cannot query by "john@example.com", we must query by the hash "a3f..."
    const emailIndex = hashForIndex(email);

    // 3. Lookup User by Index in Professional Schema
    const { data: user, error } = await supabaseAdmin
      .schema('professional')
      .from('users')
      .select('*')
      .eq('email_index', emailIndex)
      .single();

    // Generic error message to prevent enumeration (don't say "User not found")
    if (error || !user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // 4. Verify Password using Argon2id
    const isValidPassword = await argon2.verify(user.password_hash, password);

    if (!isValidPassword) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // 5. Update Last Login Timestamp
    await supabaseAdmin
      .schema('professional')
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);

    // 6. Generate 30-Day Session Token
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const token = await new SignJWT({
      uid: user.id,
      schema: 'professional',
      has_totp: user.has_totp || false,
      aal: 1 // Authentication Assurance Level 1 (Password only)
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('30d')
      .sign(secret);

    // 7. Set Cookie & Return
    const response = NextResponse.json({ success: true });

    response.cookies.set('profcaria_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('Professional Login Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}