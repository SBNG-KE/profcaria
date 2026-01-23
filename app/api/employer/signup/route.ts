//app/api/employer/signup/route.ts

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { encryptData, hashForIndex } from '@/lib/security';
import { checkRateLimit, getClientIdentifier, rateLimitedResponse } from '@/lib/rate-limit';
import * as argon2 from 'argon2';
import { SignJWT } from 'jose';

// Force Node.js runtime for Argon2
export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    // Rate Limiting Check (5 signups/minute per IP)
    const clientId = getClientIdentifier(req);
    const rateCheck = checkRateLimit(clientId, 'signup');
    if (!rateCheck.allowed) {
      return rateLimitedResponse(rateCheck.resetIn);
    }

    const body = await req.json();
    const {
      companyName,
      workEmail,
      password,
    } = body;

    // 1. Validation
    if (!workEmail || !password || !companyName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 2. Create Blind Indexes
    const emailIndex = hashForIndex(workEmail);
    const phoneIndex = null;

    // 3. Check for existing company (Email or Name)
    const { data: existingEmail } = await supabaseAdmin
      .schema('employer')
      .from('companies')
      .select('id')
      .eq('work_email_index', emailIndex)
      .single();

    if (existingEmail) {
      return NextResponse.json({ error: 'Company email already registered' }, { status: 409 });
    }

    const companyNameIndex = hashForIndex(companyName);
    const { data: existingName } = await supabaseAdmin
      .schema('employer')
      .from('companies')
      .select('id')
      .eq('company_name_index', companyNameIndex)
      .single();

    if (existingName) {
      return NextResponse.json({ error: 'Company name already registered' }, { status: 409 });
    }

    // 4. Hash Password
    const passwordHash = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
    });

    // 5. Encrypt Sensitive Data
    const encCompanyName = encryptData(companyName);
    // Even the logo URL is encrypted so no one can scrape your list of customers by checking blob URLs
    const encLogo = null;

    // 6. Insert into Employer Schema
    const { data, error } = await supabaseAdmin
      .schema('employer')
      .from('companies')
      .insert([
        {
          work_email_index: emailIndex,
          company_name_index: companyNameIndex,
          phone_index: phoneIndex,
          password_hash: passwordHash,
          enc_company_name: encCompanyName,
          enc_logo_url: encLogo,
          enc_work_email: encryptData(workEmail),
          enc_phone_number: null,
          // Default security settings
          requires_2fa: true,
          allow_passkeys: true
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Supabase Error:', error);
      throw error;
    }

    // 7. Generate Session Token (30 Days)
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const token = await new SignJWT({ uid: data.id, schema: 'employer' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('30d')
      .sign(secret);

    // 8. Set Cookie
    const response = NextResponse.json({ success: true, company_id: data.id, redirect: '/employer/feed' });

    response.cookies.set('profcaria_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });

    return response;

  } catch (error: any) {
    console.error('Employer Signup Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}