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

export async function POST(request: Request) {
  const session = await getOndwiraSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const input = await request.json().catch(() => null) as { name?: string } | null;
  const name = input?.name?.trim().replace(/\s+/g, ' ').slice(0, 120);
  if (!name || name.length < 2) return NextResponse.json({ error: 'Enter an organisation name' }, { status: 400 });

  const { data: organization, error: organizationError } = await supabaseAdmin.schema('ondwira').from('organizations')
    .insert({ name, created_by: session.uid }).select('id, name, updated_at').single();
  if (organizationError || !organization) return NextResponse.json({ error: 'Unable to create the organisation' }, { status: 500 });

  const { error: membershipError } = await supabaseAdmin.schema('ondwira').from('organization_members').insert({ organization_id: organization.id, user_id: session.uid, account_type: session.schema, role: 'owner', status: 'active', joined_at: new Date().toISOString() });
  if (membershipError) {
    await supabaseAdmin.schema('ondwira').from('organizations').delete().eq('id', organization.id);
    return NextResponse.json({ error: 'Unable to create the organisation membership' }, { status: 500 });
  }

  const { data: conversation, error: conversationError } = await supabaseAdmin.schema('ondwira').from('conversations')
    .insert({ kind: 'group', context: 'work', title: `${name} company`, created_by: session.uid }).select('id').single();
  if (conversationError || !conversation) {
    await supabaseAdmin.schema('ondwira').from('organizations').delete().eq('id', organization.id);
    return NextResponse.json({ error: 'The organisation could not open its automatic company group.' }, { status: 500 });
  }
  const { error: conversationMemberError } = await supabaseAdmin.schema('ondwira').from('conversation_members').insert({ conversation_id: conversation.id, user_id: session.uid, account_type: session.schema, role: 'owner', membership_status: 'accepted' });
  if (conversationMemberError) {
    await supabaseAdmin.schema('ondwira').from('conversations').delete().eq('id', conversation.id);
    await supabaseAdmin.schema('ondwira').from('organizations').delete().eq('id', organization.id);
    return NextResponse.json({ error: 'The organisation owner could not be added to its company group.' }, { status: 500 });
  }
  const { data: group, error: groupError } = await supabaseAdmin.schema('ondwira').from('work_groups').insert({ organization_id: organization.id, conversation_id: conversation.id, name: `${name} company`, group_type: 'company', auto_membership: true, created_by: session.uid }).select('id, name, group_type, auto_membership, conversation_id, created_at').single();
  if (groupError || !group) {
    await supabaseAdmin.schema('ondwira').from('conversations').delete().eq('id', conversation.id);
    await supabaseAdmin.schema('ondwira').from('organizations').delete().eq('id', organization.id);
    return NextResponse.json({ error: 'The organisation could not complete its automatic company group.' }, { status: 500 });
  }
  const { error: groupMemberError } = await supabaseAdmin.schema('ondwira').from('work_group_members').insert({ group_id: group.id, user_id: session.uid, role: 'owner', membership_source: 'organization' });
  if (groupMemberError) {
    await supabaseAdmin.schema('ondwira').from('conversations').delete().eq('id', conversation.id);
    await supabaseAdmin.schema('ondwira').from('organizations').delete().eq('id', organization.id);
    return NextResponse.json({ error: 'The organisation owner could not enter its automatic company group.' }, { status: 500 });
  }

  return NextResponse.json({ organization: { role: 'owner', status: 'active', organizations: organization }, group }, { status: 201 });
}
