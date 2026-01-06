import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { hashForIndex, encryptData } from '@/lib/security';
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

    // 6a. Log Activity (Security)
    // Safe logging - does not block flow
    try {
      const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
      const userAgent = req.headers.get('user-agent') || 'Unknown UA';

      let locationString = 'Unknown Location';
      try {
        // IP Geolocation (Server-side)
        if (ip && ip.length > 7 && !ip.includes('127.0.0.1') && !ip.includes('localhost')) {
          const geoRes = await fetch(`http://ip-api.com/json/${ip.split(',')[0].trim()}`);
          if (geoRes.ok) {
            const geo = await geoRes.json();
            if (geo.status === 'success') {
              locationString = `${geo.city}, ${geo.country}`;
            }
          }
        }
      } catch (err) {
        console.error('Geo Lookup Failed:', err);
      }

      await supabaseAdmin
        .schema('professional')
        .from('activity_logs')
        .insert([{
          user_id: user.id,
          enc_action: encryptData('LOGIN'),
          enc_ip_address: encryptData(ip),
          user_agent: userAgent,
          enc_location_details: encryptData(locationString)
        }]);
    } catch (e) {
      console.error('Login Log Error:', e);
    }

    // 7. Set Cookie & Return
    const response = NextResponse.json({ success: true, redirect: '/professional/home' });

    response.cookies.set('profcaria_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      expires: new Date(Date.now() + 60 * 60 * 24 * 30 * 1000), // Explicit expiry
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('Professional Login Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}