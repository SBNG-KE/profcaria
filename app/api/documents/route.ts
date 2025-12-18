import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { supabaseAdmin } from '@/lib/supabase';
import { encryptData, decryptData } from '@/lib/security';

export const runtime = 'nodejs';

// --- GET: Load Document ---
export async function GET(req: Request) {
  try {
    // 1. Auth Check
    const cookieStore = await cookies();
    const token = cookieStore.get('profcaria_session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.uid as string;

    // 2. Get Doc Type from URL
    const { searchParams } = new URL(req.url);
    const docType = searchParams.get('type');

    if (!docType) return NextResponse.json({ error: 'Type required' }, { status: 400 });

    // 3. Fetch Encrypted Data
    const { data, error } = await supabaseAdmin
      .schema('professional')
      .from('documents')
      .select('enc_content, last_updated')
      .eq('user_id', userId)
      .eq('doc_type', docType)
      .single();

    if (error && error.code !== 'PGRST116') { // Ignore "not found" error
       console.error('Fetch Error:', error);
       return NextResponse.json({ error: 'DB Error' }, { status: 500 });
    }

    // 4. Decrypt if data exists
    let content = '';
    if (data && data.enc_content) {
      content = decryptData(data.enc_content) || '';
    }

    return NextResponse.json({ content, lastUpdated: data?.last_updated });

  } catch (err) {
    console.error('Doc Load Error:', err);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}

// --- POST: Save Document ---
export async function POST(req: Request) {
  try {
    // 1. Auth Check
    const cookieStore = await cookies();
    const token = cookieStore.get('profcaria_session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.uid as string;

    // 2. Parse Body
    const { docType, content } = await req.json();

    // 3. Encrypt Content
    // We encrypt the whole HTML string securely before it touches the DB
    const encryptedContent = encryptData(content);

    // 4. Upsert (Insert or Update)
    const { error } = await supabaseAdmin
      .schema('professional')
      .from('documents')
      .upsert(
        { 
          user_id: userId, 
          doc_type: docType, 
          enc_content: encryptedContent,
          last_updated: new Date().toISOString()
        },
        { onConflict: 'user_id, doc_type' }
      );

    if (error) throw error;

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error('Doc Save Error:', err);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}