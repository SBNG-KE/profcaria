// app/api/employer/check-email/route.ts

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { hashForIndex } from '@/lib/security';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    const emailIndex = hashForIndex(email);
    
    // Adjust for professional vs employer schema
    const { data: user, error } = await supabaseAdmin
      .schema('employer') // or 'employer'
      .from('companies') // or 'companies'
      .select('id, requires_2fa')
      .eq('email_index', emailIndex) // or 'work_email_index' for employer
      .single();

    if (error || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      exists: true,
      requires_2fa: user.requires_2fa || false
    });

  } catch (error) {
    console.error('Check Email Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}