import { NextResponse } from 'next/server';
import { getProfcariaSession } from '@/lib/profcaria-auth';
import { supabaseAdmin } from '@/lib/supabase';
import { decryptData, encryptData, hashForIndex } from '@/lib/security';
import { validateProfcariaPhone, validateProfcariaUsername } from '@/lib/profcaria-username';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function readIdentity(accountId: string) {
  const { data, error } = await supabaseAdmin.schema('profcaria').from('accounts')
    .select('username, enc_phone_number, phone_verified_at')
    .eq('id', accountId)
    .single();
  if (error) throw error;
  const hasCustomUsername = !/^profcaria_[0-9a-f]{12}$/.test(data.username);
  return {
    username: hasCustomUsername ? data.username : '',
    hasCustomUsername,
    phoneNumber: decryptData(data.enc_phone_number) || '',
    phoneVerified: Boolean(data.phone_verified_at),
  };
}

export async function GET() {
  const session = await getProfcariaSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    return NextResponse.json({ identity: await readIdentity(session.uid) });
  } catch (error) {
    console.error('[PROFCARIA] identity settings read failed', error);
    return NextResponse.json({ error: 'Unable to load identity settings.' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await getProfcariaSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const input = await request.json().catch(() => null) as { username?: unknown; phoneNumber?: unknown } | null;
  if (!input) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });

  const changes: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (Object.prototype.hasOwnProperty.call(input, 'username')) {
    const result = validateProfcariaUsername(input.username);
    if (!result.valid) return NextResponse.json({ error: result.error }, { status: 400 });
    changes.username = result.username;
    changes.username_updated_at = new Date().toISOString();
  }
  if (Object.prototype.hasOwnProperty.call(input, 'phoneNumber')) {
    const result = validateProfcariaPhone(input.phoneNumber);
    if (!result.valid) return NextResponse.json({ error: result.error }, { status: 400 });
    changes.phone_index = result.phone ? hashForIndex(result.phone) : null;
    changes.enc_phone_number = result.phone ? encryptData(result.phone) : null;
    changes.phone_verified_at = null;
  }
  if (Object.keys(changes).length === 1) {
    return NextResponse.json({ error: 'Choose a public handle or phone number to update.' }, { status: 400 });
  }

  const { error } = await supabaseAdmin.schema('profcaria').from('accounts').update(changes).eq('id', session.uid);
  if (error) {
    if (error.code === '23505') {
      const message = error.message.includes('phone') ? 'That phone number is connected to another account.' : 'That username is already taken.';
      return NextResponse.json({ error: message }, { status: 409 });
    }
    console.error('[PROFCARIA] identity settings update failed', error);
    return NextResponse.json({ error: 'Unable to save identity settings.' }, { status: 500 });
  }

  return NextResponse.json({ identity: await readIdentity(session.uid) });
}
