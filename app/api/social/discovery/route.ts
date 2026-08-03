import { NextResponse } from 'next/server';
import { getProfcariaSession } from '@/lib/profcaria-auth';
import { resolveProfcariaAccounts } from '@/lib/profcaria-contacts';
import { supabaseAdmin } from '@/lib/supabase';
import { normalizeProfcariaUsername, validateProfcariaPhone } from '@/lib/profcaria-username';
import { hashForIndex } from '@/lib/security';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const session = await getProfcariaSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rawQuery = new URL(request.url).searchParams.get('query')?.trim() || '';
  const phoneSearch = /^[+\d][\d\s()-]+$/.test(rawQuery) && rawQuery.replace(/\D/g, '').length >= 8;
  const usernameQuery = normalizeProfcariaUsername(rawQuery);
  let accountsQuery = supabaseAdmin.schema('profcaria').from('accounts')
    .select('id, username')
    .eq('status', 'active')
    .neq('id', session.uid);

  if (phoneSearch) {
    const phone = validateProfcariaPhone(rawQuery);
    if (!phone.valid || !phone.phone) return NextResponse.json({ people: [] });
    accountsQuery = accountsQuery.eq('phone_index', hashForIndex(phone.phone)).limit(1);
  } else {
    if (usernameQuery.length < 2 || usernameQuery.length > 30 || !/^[a-z0-9_]+$/.test(usernameQuery)) {
      return NextResponse.json({ people: [] });
    }
    accountsQuery = accountsQuery
      .gte('username', usernameQuery)
      .lt('username', `${usernameQuery}\uffff`)
      .order('username', { ascending: true })
      .limit(12);
  }

  const { data: accounts, error } = await accountsQuery;
  if (error) {
    console.error('[PROFCARIA] account discovery failed', error);
    return NextResponse.json({ error: 'Unable to search accounts.' }, { status: 500 });
  }

  const ids = (accounts ?? []).map((account: { id: string; username: string }) => account.id);
  if (!ids.length) return NextResponse.json({ people: [] });
  const [{ data: identities }, profiles] = await Promise.all([
    supabaseAdmin.schema('profcaria').from('account_identities')
      .select('account_id, identity_type')
      .in('account_id', ids)
      .in('identity_type', ['professional', 'employer']),
    resolveProfcariaAccounts(ids),
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
      name: profile?.name || 'Profcaria member',
      avatarUrl: profile?.avatarUrl || null,
    }];
  });

  return NextResponse.json({ people });
}
