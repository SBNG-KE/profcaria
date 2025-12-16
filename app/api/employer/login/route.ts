//app/api/employer/login/route.ts

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { hashForIndex } from '@/lib/security';
import * as argon2 from 'argon2';
import { SignJWT } from 'jose';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body; // 'email' here is the Work Email

    if (!email || !password) {
      return NextResponse.json({ error: 'Credentials required' }, { status: 400 });
    }

    // 1. Blind Index Lookup
    const emailIndex = hashForIndex(email);

    // 2. Find Company in Employer Schema
    const { data: company, error } = await supabaseAdmin
      .schema('employer')
      .from('companies')
      .select('*')
      .eq('work_email_index', emailIndex)
      .single();

    if (error || !company) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // 3. Verify Password
    const isValid = await argon2.verify(company.password_hash, password);

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // 4. Update Login Timestamp
    // (Optional: You might want to log this in a separate audit table for security)
    await supabaseAdmin
      .schema('employer')
      .from('companies')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', company.id);

    // 5. Generate Session Token
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const token = await new SignJWT({
      uid: company.id,
      schema: 'employer',
      has_totp: company.has_totp || false,
      aal: 1 // Authentication Assurance Level 1 (Password only)
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('30d')
      .sign(secret);

    // 6. Return
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
    console.error('Login Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}