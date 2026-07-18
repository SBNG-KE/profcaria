import { NextResponse } from 'next/server';
import { getOndwiraSession } from '@/lib/ondwira-auth';
import { getOrganizationMembership, ORGANIZATION_MANAGER_ROLES } from '@/lib/ondwira-organizations';
import { supabaseAdmin } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getOndwiraSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const input = await request.json().catch(() => null) as { action?: string; name?: string; userId?: string } | null;
  if (!input?.action) return NextResponse.json({ error: 'Group action required.' }, { status: 400 });
  const { data: group, error } = await supabaseAdmin.schema('ondwira').from('work_groups')
    .select('id, organization_id, conversation_id, name, group_type, auto_membership, archived_at').eq('id', id).maybeSingle();
  if (error || !group || group.archived_at) return NextResponse.json({ error: 'Work group not found.' }, { status: 404 });
  const actor = await getOrganizationMembership(group.organization_id, session.uid);
  if (!actor || actor.status !== 'active' || !ORGANIZATION_MANAGER_ROLES.includes(actor.role)) {
    return NextResponse.json({ error: 'You cannot manage this work group.' }, { status: 403 });
  }

  if (input.action === 'rename') {
    if (group.auto_membership || group.group_type === 'company') return NextResponse.json({ error: 'The automatic company group keeps the organisation name.' }, { status: 409 });
    const name = input.name?.trim().replace(/\s+/g, ' ').slice(0, 120);
    if (!name || name.length < 2) return NextResponse.json({ error: 'Enter a group name.' }, { status: 400 });
    const { error: updateError } = await supabaseAdmin.schema('ondwira').from('work_groups').update({ name }).eq('id', id);
    if (updateError) return NextResponse.json({ error: 'The group could not be renamed.' }, { status: 500 });
    if (group.conversation_id) await supabaseAdmin.schema('ondwira').from('conversations').update({ title: name, updated_at: new Date().toISOString() }).eq('id', group.conversation_id);
    return NextResponse.json({ success: true, name });
  }

  if (input.action === 'archive') {
    if (group.auto_membership || group.group_type === 'company') return NextResponse.json({ error: 'The automatic company group cannot be archived.' }, { status: 409 });
    const now = new Date().toISOString();
    const { error: archiveError } = await supabaseAdmin.schema('ondwira').from('work_groups').update({ archived_at: now }).eq('id', id);
    if (archiveError) return NextResponse.json({ error: 'The group could not be archived.' }, { status: 500 });
    await supabaseAdmin.schema('ondwira').from('work_group_members').update({ removed_at: now }).eq('group_id', id).is('removed_at', null);
    if (group.conversation_id) await supabaseAdmin.schema('ondwira').from('conversation_members').update({ membership_status: 'removed' }).eq('conversation_id', group.conversation_id);
    return NextResponse.json({ success: true, archived: true });
  }

  if (!['add_member', 'remove_member'].includes(input.action) || !input.userId) return NextResponse.json({ error: 'Choose a valid group member action.' }, { status: 400 });
  if (group.auto_membership) return NextResponse.json({ error: 'Membership in this group follows organisation access automatically.' }, { status: 409 });
  const target = await getOrganizationMembership(group.organization_id, input.userId);
  if (!target || target.status !== 'active') return NextResponse.json({ error: 'Only active organisation members can join a work group.' }, { status: 409 });

  if (input.action === 'add_member') {
    const now = new Date().toISOString();
    const { data: existing } = await supabaseAdmin.schema('ondwira').from('work_group_members').select('role').eq('group_id', id).eq('user_id', input.userId).maybeSingle();
    const { error: memberError } = await supabaseAdmin.schema('ondwira').from('work_group_members').upsert({
      group_id: id,
      user_id: input.userId,
      role: existing?.role || 'member',
      membership_source: 'manual',
      joined_at: now,
      removed_at: null,
    }, { onConflict: 'group_id,user_id' });
    if (memberError) return NextResponse.json({ error: 'The person could not be added to this group.' }, { status: 500 });
    if (group.conversation_id) {
      const { error: conversationError } = await supabaseAdmin.schema('ondwira').from('conversation_members').upsert({
        conversation_id: group.conversation_id,
        user_id: input.userId,
        account_type: target.account_type,
        role: existing?.role === 'owner' ? 'owner' : 'member',
        membership_status: 'accepted',
      }, { onConflict: 'conversation_id,user_id' });
      if (conversationError) return NextResponse.json({ error: 'Group membership changed, but its work chat could not be synchronized.' }, { status: 500 });
    }
    return NextResponse.json({ success: true, member: true });
  }

  const { data: groupMembership } = await supabaseAdmin.schema('ondwira').from('work_group_members').select('role').eq('group_id', id).eq('user_id', input.userId).maybeSingle();
  if (groupMembership?.role === 'owner') return NextResponse.json({ error: 'The group owner cannot be removed.' }, { status: 409 });
  const now = new Date().toISOString();
  const { error: removeError } = await supabaseAdmin.schema('ondwira').from('work_group_members').update({ removed_at: now }).eq('group_id', id).eq('user_id', input.userId).is('removed_at', null);
  if (removeError) return NextResponse.json({ error: 'The person could not be removed from this group.' }, { status: 500 });
  if (group.conversation_id) await supabaseAdmin.schema('ondwira').from('conversation_members').update({ membership_status: 'removed' }).eq('conversation_id', group.conversation_id).eq('user_id', input.userId);
  return NextResponse.json({ success: true, member: false });
}
