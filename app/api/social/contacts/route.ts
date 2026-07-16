import { NextResponse } from 'next/server';
import { getOndwiraSession } from '@/lib/ondwira-auth';
import { getOndwiraContacts } from '@/lib/ondwira-contacts';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * A privacy-preserving bridge to the existing approved professional network.
 * It intentionally returns only an ID, display name and avatar—not phone numbers,
 * email addresses, or a searchable list of every Ondwira account.
 */
export async function GET() {
  const session = await getOndwiraSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    return NextResponse.json({ contacts: await getOndwiraContacts(session) });
  } catch {
    return NextResponse.json({ error: 'Unable to load contacts' }, { status: 500 });
  }
}
