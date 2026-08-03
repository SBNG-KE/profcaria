import { NextResponse } from 'next/server';
import { getProfcariaSession } from '@/lib/profcaria-auth';
import { getProfcariaContacts } from '@/lib/profcaria-contacts';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * A privacy-preserving bridge to the existing approved professional network.
 * It intentionally returns only an ID, display name and avatar—not phone numbers,
 * email addresses, or a searchable list of every Profcaria account.
 */
export async function GET() {
  const session = await getProfcariaSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    return NextResponse.json({ contacts: await getProfcariaContacts(session) });
  } catch {
    return NextResponse.json({ error: 'Unable to load contacts' }, { status: 500 });
  }
}
