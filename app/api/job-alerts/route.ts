import { NextResponse } from 'next/server';
import { getProfcariaSession } from '@/lib/profcaria-auth';
import { supabaseAdmin } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type AlertInput = {
  label?: string;
  query?: string;
  roleCategories?: string[];
  locationTypes?: string[];
  employmentTypes?: string[];
  locations?: string[];
  organizationIds?: string[];
  frequency?: string;
  emailEnabled?: boolean;
};

const cleanText = (value: unknown, limit: number) => typeof value === 'string' ? value.trim().replace(/\s+/g, ' ').slice(0, limit) : '';
const cleanList = (value: unknown, limit = 20) => Array.isArray(value)
  ? [...new Set(value.map(item => cleanText(item, 120)).filter(Boolean))].slice(0, limit)
  : [];

export async function GET() {
  const session = await getProfcariaSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data, error } = await supabaseAdmin.schema('profcaria').from('job_alert_subscriptions')
    .select('id, label, query, role_categories, location_types, employment_types, locations, organization_ids, frequency, email_enabled, enabled, last_sent_at, created_at')
    .eq('account_id', session.uid).order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: 'Job alerts could not be loaded.' }, { status: 500 });
  return NextResponse.json({ alerts: data ?? [] });
}

export async function POST(request: Request) {
  const session = await getProfcariaSession();
  if (!session) return NextResponse.json({ error: 'Sign in to save this job alert.' }, { status: 401 });
  const input = await request.json().catch(() => null) as AlertInput | null;
  if (!input) return NextResponse.json({ error: 'Invalid job alert.' }, { status: 400 });

  const frequency = ['instant', 'daily', 'weekly'].includes(input.frequency || '') ? input.frequency : 'instant';
  const values = {
    account_id: session.uid,
    label: cleanText(input.label, 80) || 'My job alert',
    query: cleanText(input.query, 160),
    role_categories: cleanList(input.roleCategories),
    location_types: cleanList(input.locationTypes, 8),
    employment_types: cleanList(input.employmentTypes, 10),
    locations: cleanList(input.locations),
    organization_ids: cleanList(input.organizationIds),
    frequency,
    email_enabled: input.emailEnabled !== false,
  };
  const { data, error } = await supabaseAdmin.schema('profcaria').from('job_alert_subscriptions')
    .insert(values).select('id, label, frequency, email_enabled, enabled, created_at').single();
  if (error) return NextResponse.json({ error: 'This job alert could not be saved.' }, { status: 500 });
  return NextResponse.json({ alert: data }, { status: 201 });
}

export async function DELETE(request: Request) {
  const session = await getProfcariaSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Choose a job alert.' }, { status: 400 });
  const { error } = await supabaseAdmin.schema('profcaria').from('job_alert_subscriptions')
    .delete().eq('id', id).eq('account_id', session.uid);
  if (error) return NextResponse.json({ error: 'This job alert could not be removed.' }, { status: 500 });
  return NextResponse.json({ success: true });
}
