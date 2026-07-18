import { NextResponse } from 'next/server';
import { getOndwiraSession } from '@/lib/ondwira-auth';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

async function membership(organizationId: string, userId: string) {
  const { data } = await supabaseAdmin.schema('ondwira').from('organization_members').select('role, status').eq('organization_id', organizationId).eq('user_id', userId).maybeSingle();
  return data;
}

export async function GET(request: Request) {
  const session = await getOndwiraSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const organizationId = new URL(request.url).searchParams.get('organizationId');
  if (!organizationId || (await membership(organizationId, session.uid))?.status !== 'active') return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const { data, error } = await supabaseAdmin.schema('ondwira').from('work_groups').select('id, name, group_type, auto_membership, conversation_id, created_at').eq('organization_id', organizationId).is('archived_at', null).order('created_at');
  if (error) return NextResponse.json({ error: 'Unable to load groups' }, { status: 500 });
  return NextResponse.json({ groups: data ?? [] });
}

export async function POST(request: Request) {
  const session = await getOndwiraSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const input = await request.json().catch(() => null) as { organizationId?: string; name?: string; groupType?: string; memberIds?: string[] } | null;
  const name = input?.name?.trim().slice(0, 120);
  const groupType = ['team', 'project', 'custom'].includes(input?.groupType || '') ? input!.groupType! : 'custom';
  if (!input?.organizationId || !name) return NextResponse.json({ error: 'Organisation and group name are required' }, { status: 400 });
  const actor = await membership(input.organizationId, session.uid);
  if (!actor || actor.status !== 'active' || !['owner', 'admin', 'manager'].includes(actor.role)) return NextResponse.json({ error: 'Only workspace managers can create groups' }, { status: 403 });
  const requested = [...new Set([session.uid, ...(input.memberIds ?? [])])];
  const { data: allowed } = await supabaseAdmin.schema('ondwira').from('organization_members').select('user_id, account_type').eq('organization_id', input.organizationId).eq('status', 'active').in('user_id', requested);
  const memberIds: string[] = (allowed ?? []).map((item: { user_id: string }) => item.user_id);
  if (memberIds.length !== requested.length) return NextResponse.json({ error: 'Every group member must have active organisation access.' }, { status: 409 });
  const accountTypes = new Map((allowed ?? []).map((item: { user_id: string; account_type: 'professional' | 'employer' }) => [item.user_id, item.account_type]));
  const { data: conversation, error: conversationError } = await supabaseAdmin.schema('ondwira').from('conversations').insert({ kind: 'group', context: 'work', title: name, created_by: session.uid }).select('id').single();
  if (conversationError || !conversation) return NextResponse.json({ error: 'Unable to create group conversation' }, { status: 500 });
  const { data: group, error: groupError } = await supabaseAdmin.schema('ondwira').from('work_groups').insert({ organization_id: input.organizationId, conversation_id: conversation.id, name, group_type: groupType, auto_membership: false, created_by: session.uid }).select('id, name, group_type, auto_membership, conversation_id, created_at').single();
  if (groupError || !group) {
    await supabaseAdmin.schema('ondwira').from('conversations').delete().eq('id', conversation.id);
    return NextResponse.json({ error: 'Unable to create group' }, { status: 500 });
  }
  const { error: groupMemberError } = await supabaseAdmin.schema('ondwira').from('work_group_members').insert(memberIds.map((userId: string) => ({ group_id: group.id, user_id: userId, role: userId === session.uid ? 'owner' : 'member', membership_source: 'manual' })));
  const { error: conversationMemberError } = groupMemberError ? { error: groupMemberError } : await supabaseAdmin.schema('ondwira').from('conversation_members').insert(memberIds.map((userId: string) => ({ conversation_id: conversation.id, user_id: userId, account_type: accountTypes.get(userId) || session.schema, role: userId === session.uid ? 'owner' : 'member', membership_status: 'accepted' })));
  if (groupMemberError || conversationMemberError) {
    await supabaseAdmin.schema('ondwira').from('work_groups').delete().eq('id', group.id);
    await supabaseAdmin.schema('ondwira').from('conversations').delete().eq('id', conversation.id);
    return NextResponse.json({ error: 'The group members could not be synchronized.' }, { status: 500 });
  }
  return NextResponse.json({ group }, { status: 201 });
}
