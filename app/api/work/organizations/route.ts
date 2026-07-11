import { NextResponse } from 'next/server';
import { getOndwiraSession } from '@/lib/ondwira-auth';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getOndwiraSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data, error } = await supabaseAdmin.schema('ondwira').from('organization_members')
    .select('role, status, organizations!inner(id, name, updated_at)').eq('user_id', session.uid).eq('status', 'active');
  if (error) return NextResponse.json({ error: 'Unable to load organisations' }, { status: 500 });
  return NextResponse.json({ organizations: data ?? [] });
}
