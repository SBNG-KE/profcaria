import { NextResponse } from 'next/server';
import { getOndwiraSession } from '@/lib/ondwira-auth';
import { resolveOndwiraAccounts } from '@/lib/ondwira-contacts';
import { supabaseAdmin } from '@/lib/supabase';
import { normalizeOndwiraUsername } from '@/lib/ondwira-username';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const session = await getOndwiraSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const query = normalizeOndwiraUsername(new URL(request.url).searchParams.get('query'));
  if (query.length < 2 || query.length > 30 || !/^[a-z0-9_]+$/.test(query)) {
    return NextResponse.json({ people: [] });
  }

  const { data: accounts, error } = await supabaseAdmin.schema('ondwira').from('accounts')
    .select('id, username')
    .eq('status', 'active')
    .neq('id', session.uid)
    .gte('username', query)
    .lt('username', `${query}\uffff`)
    .order('username', { ascending: true })
    .limit(12);
  if (error) {
    console.error('[ONDWIRA] username discovery failed', error);
    return NextResponse.json({ error: 'Unable to search usernames.' }, { status: 500 });
  }

  const ids = (accounts ?? []).map((account: { id: string; username: string }) => account.id);
  if (!ids.length) return NextResponse.json({ people: [] });
  const [{ data: identities }, profiles] = await Promise.all([
    supabaseAdmin.schema('ondwira').from('account_identities')
      .select('account_id, identity_type')
      .in('account_id', ids)
      .in('identity_type', ['professional', 'employer']),
    resolveOndwiraAccounts(ids),
  ]);

  const identityTypes = new Map<string, 'professional' | 'employer'>();
  (identities ?? []).forEach((identity: { account_id: string; identity_type: string }) => {
    if (identity.identity_type === 'professional' || !identityTypes.has(identity.account_id)) {
      identityTypes.set(identity.account_id, identity.identity_type as 'professional' | 'employer');
    }
  });

  const people = (accounts ?? []).flatMap((account: { id: string; username: string }) => {
    const type = identityTypes.get(account.id);
    if (!type) return [];
    const profile = profiles.get(account.id);
    return [{
      id: account.id,
      type,
      username: account.username,
      name: profile?.name || 'Ondwira member',
      avatarUrl: profile?.avatarUrl || null,
    }];
  });

  return NextResponse.json({ people });
}
