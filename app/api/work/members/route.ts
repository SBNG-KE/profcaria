import { NextResponse } from 'next/server';
import { getOndwiraSession } from '@/lib/ondwira-auth';
import { supabaseAdmin } from '@/lib/supabase';
import { decryptData } from '@/lib/security';

export async function GET(request: Request) {
  const session = await getOndwiraSession(); if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const organizationId = new URL(request.url).searchParams.get('organizationId'); if (!organizationId) return NextResponse.json({ error: 'Organisation required' }, { status: 400 });
  const { data: viewer } = await supabaseAdmin.schema('ondwira').from('organization_members').select('status').eq('organization_id', organizationId).eq('user_id', session.uid).maybeSingle(); if (viewer?.status !== 'active') return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const { data: rows, error } = await supabaseAdmin.schema('ondwira').from('organization_members').select('user_id, account_type, role').eq('organization_id', organizationId).eq('status', 'active'); if (error) return NextResponse.json({ error: 'Unable to load people' }, { status: 500 });
  const professionalIds = (rows ?? []).filter((row: { account_type: string }) => row.account_type === 'professional').map((row: { user_id: string }) => row.user_id); const employerIds = (rows ?? []).filter((row: { account_type: string }) => row.account_type === 'employer').map((row: { user_id: string }) => row.user_id);
  const { data: people } = professionalIds.length ? await supabaseAdmin.schema('professional').from('users').select('id, enc_first_name, enc_last_name').in('id', professionalIds) : { data: [] };
  const { data: companies } = employerIds.length ? await supabaseAdmin.schema('employer').from('companies').select('id, enc_company_name').in('id', employerIds) : { data: [] };
  const names = new Map<string, string>();
  (people ?? []).forEach((person: { id: string; enc_first_name: string; enc_last_name: string }) => names.set(person.id, `${decryptData(person.enc_first_name) || ''} ${decryptData(person.enc_last_name) || ''}`.trim() || 'Member'));
  (companies ?? []).forEach((company: { id: string; enc_company_name: string }) => names.set(company.id, decryptData(company.enc_company_name) || 'Organisation'));
  return NextResponse.json({ members: (rows ?? []).map((row: { user_id: string; account_type: string; role: string }) => ({ id: row.user_id, accountType: row.account_type, role: row.role, name: names.get(row.user_id) || 'Member' })) });
}
