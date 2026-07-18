import { createHash, randomBytes } from 'crypto';
import { NextResponse } from 'next/server';
import { getOndwiraSession } from '@/lib/ondwira-auth';
import { resolveOndwiraAccounts } from '@/lib/ondwira-contacts';
import {
  addAutomaticOrganizationAccess,
  getOrganizationMembership,
  PEOPLE_MANAGER_ROLES,
  removeOrganizationAccess,
  type OrganizationRole,
} from '@/lib/ondwira-organizations';
import { validateOndwiraUsername } from '@/lib/ondwira-username';
import { supabaseAdmin } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ROLES: OrganizationRole[] = ['owner', 'admin', 'manager', 'member'];

function canAssignRole(actorRole: OrganizationRole, role: OrganizationRole) {
  if (actorRole === 'owner') return ['admin', 'manager', 'member'].includes(role);
  return actorRole === 'admin' && ['manager', 'member'].includes(role);
}

export async function GET(request: Request) {
  const session = await getOndwiraSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const organizationId = new URL(request.url).searchParams.get('organizationId');
  if (!organizationId) return NextResponse.json({ error: 'Organisation required.' }, { status: 400 });

  const viewer = await getOrganizationMembership(organizationId, session.uid);
  if (!viewer || viewer.status !== 'active') return NextResponse.json({ error: 'Organisation not found.' }, { status: 404 });
  const canManagePeople = PEOPLE_MANAGER_ROLES.includes(viewer.role);
  const [{ data: organization }, memberResult, groupResult] = await Promise.all([
    supabaseAdmin.schema('ondwira').from('organizations').select('id, name, updated_at').eq('id', organizationId).single(),
    canManagePeople
      ? supabaseAdmin.schema('ondwira').from('organization_members')
          .select('user_id, account_type, role, status, joined_at, ended_at').eq('organization_id', organizationId).order('joined_at')
      : supabaseAdmin.schema('ondwira').from('organization_members')
          .select('user_id, account_type, role, status, joined_at, ended_at').eq('organization_id', organizationId).eq('status', 'active').order('joined_at'),
    supabaseAdmin.schema('ondwira').from('work_groups')
      .select('id, name, group_type, auto_membership, conversation_id, created_at').eq('organization_id', organizationId).is('archived_at', null).order('created_at'),
  ]);
  if (!organization || memberResult.error || groupResult.error) {
    return NextResponse.json({ error: 'Unable to load the organisation directory.' }, { status: 500 });
  }

  const memberRows = memberResult.data ?? [];
  const groups = groupResult.data ?? [];
  const memberIds = memberRows.map((member: { user_id: string }) => member.user_id);
  const groupIds = groups.map((group: { id: string }) => group.id);
  const [profiles, accountResult, employmentResult, groupMemberResult, invitationResult] = await Promise.all([
    resolveOndwiraAccounts(memberIds),
    memberIds.length
      ? supabaseAdmin.schema('ondwira').from('accounts').select('id, username').in('id', memberIds)
      : Promise.resolve({ data: [], error: null }),
    memberIds.length
      ? supabaseAdmin.schema('ondwira').from('employment_records')
          .select('user_id, title, status, started_at, ended_at, verification_status').eq('organization_id', organizationId).in('user_id', memberIds).order('started_at', { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    groupIds.length
      ? supabaseAdmin.schema('ondwira').from('work_group_members')
          .select('group_id, user_id, role, membership_source, joined_at').in('group_id', groupIds).is('removed_at', null)
      : Promise.resolve({ data: [], error: null }),
    canManagePeople
      ? supabaseAdmin.schema('ondwira').from('organization_invitations')
          .select('id, invitee_account_id, role, status, expires_at, created_at').eq('organization_id', organizationId).eq('status', 'pending').order('created_at', { ascending: false })
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (accountResult.error || employmentResult.error || groupMemberResult.error || invitationResult.error) {
    return NextResponse.json({ error: 'Unable to complete the organisation directory.' }, { status: 500 });
  }

  const usernames = new Map<string, string>();
  (accountResult.data ?? []).forEach((account: { id: string; username: string }) => usernames.set(account.id, account.username));
  const employmentByMember = new Map<string, { title: string; status: string; started_at: string | null; ended_at: string | null; verification_status: string | null }>();
  (employmentResult.data ?? []).forEach((employment: { user_id: string; title: string; status: string; started_at: string | null; ended_at: string | null; verification_status: string | null }) => {
    if (!employmentByMember.has(employment.user_id)) employmentByMember.set(employment.user_id, employment);
  });
  const groupIdsByMember = new Map<string, string[]>();
  (groupMemberResult.data ?? []).forEach((membership: { group_id: string; user_id: string }) => {
    groupIdsByMember.set(membership.user_id, [...(groupIdsByMember.get(membership.user_id) ?? []), membership.group_id]);
  });

  const pendingInvitations = (invitationResult.data ?? []).filter((invitation: { invitee_account_id: string | null }) => invitation.invitee_account_id);
  const invitationAccountIds = pendingInvitations.map((invitation: { invitee_account_id: string }) => invitation.invitee_account_id);
  const [invitedProfiles, invitedAccountResult] = await Promise.all([
    resolveOndwiraAccounts(invitationAccountIds),
    invitationAccountIds.length
      ? supabaseAdmin.schema('ondwira').from('accounts').select('id, username').in('id', invitationAccountIds)
      : Promise.resolve({ data: [], error: null }),
  ]);
  const invitedUsernames = new Map<string, string>();
  (invitedAccountResult.data ?? []).forEach((account: { id: string; username: string }) => invitedUsernames.set(account.id, account.username));

  return NextResponse.json({
    organization,
    viewer: { id: session.uid, role: viewer.role, canManagePeople, canManageGroups: ['owner', 'admin', 'manager'].includes(viewer.role) },
    members: memberRows.map((member: { user_id: string; account_type: string; role: string; status: string; joined_at: string | null; ended_at: string | null }) => ({
      id: member.user_id,
      accountType: member.account_type,
      name: profiles.get(member.user_id)?.name || 'Ondwira member',
      avatarUrl: profiles.get(member.user_id)?.avatarUrl || null,
      username: usernames.get(member.user_id) || '',
      role: member.role,
      status: member.status,
      joinedAt: member.joined_at,
      endedAt: member.ended_at,
      groupIds: groupIdsByMember.get(member.user_id) ?? [],
      employment: employmentByMember.get(member.user_id) || null,
    })),
    groups: groups.map((group: { id: string; name: string; group_type: string; auto_membership: boolean; conversation_id: string | null; created_at: string }) => ({
      id: group.id,
      name: group.name,
      groupType: group.group_type,
      autoMembership: group.auto_membership,
      conversationId: group.conversation_id,
      createdAt: group.created_at,
      memberIds: (groupMemberResult.data ?? []).filter((membership: { group_id: string }) => membership.group_id === group.id).map((membership: { user_id: string }) => membership.user_id),
    })),
    invitations: pendingInvitations.map((invitation: { id: string; invitee_account_id: string; role: string; expires_at: string; created_at: string }) => ({
      id: invitation.id,
      accountId: invitation.invitee_account_id,
      name: invitedProfiles.get(invitation.invitee_account_id)?.name || 'Ondwira member',
      username: invitedUsernames.get(invitation.invitee_account_id) || '',
      role: invitation.role,
      expiresAt: invitation.expires_at,
      createdAt: invitation.created_at,
    })),
  });
}

export async function POST(request: Request) {
  const session = await getOndwiraSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const input = await request.json().catch(() => null) as { organizationId?: unknown; username?: unknown; role?: unknown } | null;
  const organizationId = typeof input?.organizationId === 'string' ? input.organizationId : '';
  const usernameResult = validateOndwiraUsername(input?.username);
  const role = typeof input?.role === 'string' && ROLES.includes(input.role as OrganizationRole) ? input.role as OrganizationRole : 'member';
  if (!organizationId || !usernameResult.valid) return NextResponse.json({ error: usernameResult.error || 'Organisation required.' }, { status: 400 });

  const actor = await getOrganizationMembership(organizationId, session.uid);
  if (!actor || actor.status !== 'active' || !PEOPLE_MANAGER_ROLES.includes(actor.role)) {
    return NextResponse.json({ error: 'Only organisation owners and administrators can invite people.' }, { status: 403 });
  }
  if (!canAssignRole(actor.role, role)) return NextResponse.json({ error: 'You cannot assign that organisation role.' }, { status: 403 });

  const { data: account, error: accountError } = await supabaseAdmin.schema('ondwira').from('accounts')
    .select('id, email_index, username').eq('username', usernameResult.username).eq('status', 'active').maybeSingle();
  if (accountError || !account) return NextResponse.json({ error: 'No active Ondwira account has that exact username.' }, { status: 404 });
  if (account.id === session.uid) return NextResponse.json({ error: 'You already belong to this organisation.' }, { status: 409 });
  const existingMembership = await getOrganizationMembership(organizationId, account.id);
  if (existingMembership?.status === 'active') return NextResponse.json({ error: 'That person is already an active member.' }, { status: 409 });

  await supabaseAdmin.schema('ondwira').from('organization_invitations').update({ status: 'revoked' })
    .eq('organization_id', organizationId).eq('invitee_account_id', account.id).eq('status', 'pending');
  const tokenHash = createHash('sha256').update(randomBytes(32)).digest('hex');
  const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
  const { data: invitation, error } = await supabaseAdmin.schema('ondwira').from('organization_invitations').insert({
    organization_id: organizationId,
    invitee_account_id: account.id,
    email_index: account.email_index,
    role,
    invited_by: session.uid,
    token_hash: tokenHash,
    expires_at: expiresAt,
  }).select('id, role, expires_at, created_at').single();
  if (error || !invitation) {
    console.error('[ONDWIRA] organisation invitation failed', error);
    return NextResponse.json({ error: 'The invitation could not be created.' }, { status: error?.code === '23505' ? 409 : 500 });
  }
  return NextResponse.json({ invitation: { ...invitation, accountId: account.id, username: account.username } }, { status: 201 });
}

export async function PATCH(request: Request) {
  const session = await getOndwiraSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const input = await request.json().catch(() => null) as { organizationId?: string; userId?: string; action?: string; role?: string } | null;
  if (!input?.organizationId || !input.userId || !input.action) return NextResponse.json({ error: 'Invalid member action.' }, { status: 400 });
  const actor = await getOrganizationMembership(input.organizationId, session.uid);
  const target = await getOrganizationMembership(input.organizationId, input.userId);
  if (!actor || actor.status !== 'active' || !PEOPLE_MANAGER_ROLES.includes(actor.role)) return NextResponse.json({ error: 'You cannot manage organisation members.' }, { status: 403 });
  if (!target) return NextResponse.json({ error: 'Member not found.' }, { status: 404 });
  if (target.role === 'owner' || input.userId === session.uid) return NextResponse.json({ error: 'Ownership and your own access cannot be changed here.' }, { status: 409 });
  if (actor.role === 'admin' && target.role === 'admin') return NextResponse.json({ error: 'Only the owner can manage administrators.' }, { status: 403 });

  if (input.action === 'set_role') {
    const role = input.role as OrganizationRole;
    if (!ROLES.includes(role) || !canAssignRole(actor.role, role)) return NextResponse.json({ error: 'You cannot assign that role.' }, { status: 403 });
    const { error } = await supabaseAdmin.schema('ondwira').from('organization_members').update({ role }).eq('organization_id', input.organizationId).eq('user_id', input.userId);
    if (error) return NextResponse.json({ error: 'The member role could not be changed.' }, { status: 500 });
    return NextResponse.json({ success: true, role });
  }

  if (!['suspend', 'reactivate', 'remove'].includes(input.action)) return NextResponse.json({ error: 'Unknown member action.' }, { status: 400 });
  if (input.action === 'remove') {
    const { data: activeEmployment } = await supabaseAdmin.schema('ondwira').from('employment_records')
      .select('id').eq('organization_id', input.organizationId).eq('user_id', input.userId).in('status', ['active', 'notice']).limit(1).maybeSingle();
    if (activeEmployment) return NextResponse.json({ error: 'End this person’s employment through their application record before removing work access.' }, { status: 409 });
  }
  const now = new Date().toISOString();
  const status = input.action === 'reactivate' ? 'active' : input.action === 'suspend' ? 'suspended' : 'removed';
  const { error } = await supabaseAdmin.schema('ondwira').from('organization_members').update({
    status,
    joined_at: input.action === 'reactivate' ? target.joined_at || now : target.joined_at,
    ended_at: input.action === 'reactivate' ? null : now,
  }).eq('organization_id', input.organizationId).eq('user_id', input.userId);
  if (error) return NextResponse.json({ error: 'The member’s access could not be changed.' }, { status: 500 });
  try {
    if (input.action === 'reactivate') await addAutomaticOrganizationAccess({ organizationId: input.organizationId, userId: input.userId, accountType: target.account_type });
    else await removeOrganizationAccess(input.organizationId, input.userId);
  } catch (syncError) {
    console.error('[ONDWIRA] organisation access sync failed', syncError);
    return NextResponse.json({ error: 'Membership changed, but group access could not be synchronized.' }, { status: 500 });
  }
  return NextResponse.json({ success: true, status });
}
