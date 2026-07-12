import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import * as argon2 from 'argon2';
import { supabaseAdmin } from '@/lib/supabase';
import { hashForIndex } from '@/lib/security';
import { checkRateLimit, getClientIdentifier, rateLimitedResponse } from '@/lib/rate-limit';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const rate = await checkRateLimit(getClientIdentifier(request), 'login');
  if (!rate.allowed) return rateLimitedResponse(rate.resetIn);
  const input = await request.json().catch(() => null) as { email?: string; password?: string } | null;
  const email = input?.email?.trim().toLowerCase();
  if (!email || !input?.password) return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
  const emailIndex = hashForIndex(email);

  const [{ data: person }, { data: legacyCompany }] = await Promise.all([
    supabaseAdmin.schema('professional').from('users').select('*').eq('email_index', emailIndex).maybeSingle(),
    supabaseAdmin.schema('employer').from('companies').select('*').eq('work_email_index', emailIndex).maybeSingle(),
  ]);
  const account = person || legacyCompany;
  const schema: 'professional' | 'employer' = person ? 'professional' : 'employer';
  if (!account?.password_hash || !(await argon2.verify(account.password_hash, input.password).catch(() => false))) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }
  if (account.tos_status === 'rejected') return NextResponse.json({ error: 'This account is suspended.' }, { status: 403 });

  const secret = new TextEncoder().encode(process.env.JWT_SECRET);
  const token = await new SignJWT({ uid: account.id, schema, has_totp: Boolean(account.has_totp), aal: 1 })
    .setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('30d').sign(secret);
  const has2fa = Boolean(account.has_totp || account.has_passkey || account.has_phone_otp || account.has_email_otp);
  const response = NextResponse.json({ success: true, redirect: has2fa ? '/?mode=verify&redirect=/social' : '/social' });
  response.cookies.set('profcaria_session', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 60 * 60 * 24 * 30, path: '/' });
  return response;
}
