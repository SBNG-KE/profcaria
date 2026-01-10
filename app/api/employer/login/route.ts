//app/api/employer/login/route.ts

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { hashForIndex, encryptData } from '@/lib/security';
import { detectVPN, getRealIp } from '@/lib/vpn';
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

    // 4a. Log Activity (Security)
    try {
      let isVPN = false;
      let ip = '127.0.0.1';
      let locationString = 'Unknown Location';

      try {
        // Attempt IP/VPN Detection
        ip = await getRealIp().catch(() => '127.0.0.1');
        const vpnCheck = await detectVPN(req.headers.get('x-forwarded-for') || '').catch(() => ({ isVPN: false, reason: '' }));
        isVPN = vpnCheck.isVPN;

        if (isVPN) {
          return NextResponse.json({ error: `Security Check Failed: ${vpnCheck.reason}. Please disable VPN/Proxy.` }, { status: 403 });
        }

        // Geo Lookup
        if (ip && ip.length > 7 && !ip.includes('127.0.0.1') && !ip.includes('localhost')) {
          try {
            const geoRes = await fetch(`http://ip-api.com/json/${ip.split(',')[0].trim()}`);
            if (geoRes.ok) {
              const geo = await geoRes.json();
              if (geo.status === 'success') {
                locationString = `${geo.city}, ${geo.country}`;
              }
            }
          } catch (geoErr) {
            console.error('Geo Lookup Failed:', geoErr);
          }
        }
      } catch (detectErr) {
        console.error('Detection Logic Failed:', detectErr);
      }

      const userAgent = req.headers.get('user-agent') || 'Unknown UA';

      await supabaseAdmin
        .schema('employer')
        .from('activity_logs')
        .insert([{
          user_id: company.id,
          enc_action: encryptData('LOGIN'),
          enc_ip_address: encryptData(ip),
          user_agent: userAgent,
          enc_location_details: encryptData(locationString)
        }]);
    } catch (e) {
      console.error('Login Log Error (Non-Fatal):', e);
    }

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
    const response = NextResponse.json({ success: true, redirect: '/employer/home' });

    response.cookies.set('profcaria_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // Must be 'lax' to allow redirects and session persistence
      maxAge: 60 * 60 * 24 * 30, // 30 days
      expires: new Date(Date.now() + 60 * 60 * 24 * 30 * 1000), // Explicit expiry
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('Login Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}