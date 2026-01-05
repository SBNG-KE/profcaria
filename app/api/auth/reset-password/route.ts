// app/api/auth/reset-password/route.ts

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
import { hashForIndex } from '@/lib/security';
import * as argon2 from 'argon2';

export async function POST(req: Request) {
  try {
    const { email, newPassword, userType } = await req.json();

    if (!email || !newPassword || !userType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const emailIndex = hashForIndex(email);
    const schema = userType === 'professional' ? 'professional' : 'employer';
    const table = userType === 'professional' ? 'users' : 'companies';
    const emailField = userType === 'professional' ? 'email_index' : 'work_email_index';

    // Hash new password
    const passwordHash = await argon2.hash(newPassword, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
    });

    // Update password in database
    const { error } = await supabaseAdmin
      .schema(schema)
      .from(table)
      .update({ password_hash: passwordHash })
      .eq(emailField, emailIndex);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Password Reset Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}