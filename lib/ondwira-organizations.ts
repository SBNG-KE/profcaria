import { supabaseAdmin } from '@/lib/supabase';

export type OrganizationRole = 'owner' | 'admin' | 'manager' | 'member';
export type OrganizationAccountType = 'professional' | 'employer';

export const ORGANIZATION_MANAGER_ROLES: OrganizationRole[] = ['owner', 'admin', 'manager'];
export const PEOPLE_MANAGER_ROLES: OrganizationRole[] = ['owner', 'admin'];

export async function getOrganizationMembership(organizationId: string, userId: string) {
  const { data, error } = await supabaseAdmin.schema('ondwira').from('organization_members')
    .select('organization_id, user_id, account_type, role, status, joined_at, ended_at')
    .eq('organization_id', organizationId).eq('user_id', userId).maybeSingle();
  if (error) throw error;
  return data as null | {
    organization_id: string;
    user_id: string;
    account_type: OrganizationAccountType;
    role: OrganizationRole;
    status: string;
    joined_at: string | null;
    ended_at: string | null;
  };
}

export async function resolveOrganizationAccountType(accountId: string): Promise<OrganizationAccountType> {
  const { data, error } = await supabaseAdmin.schema('ondwira').from('account_identities')
    .select('identity_type').eq('account_id', accountId).in('identity_type', ['professional', 'employer']);
  if (error) throw error;
  if (!(data ?? []).length) throw new Error('Account identity unavailable');
  return (data ?? []).some((identity: { identity_type: string }) => identity.identity_type === 'professional')
    ? 'professional'
    : 'employer';
}

export async function addAutomaticOrganizationAccess(input: {
  organizationId: string;
  userId: string;
  accountType: OrganizationAccountType;
}) {
  const { data: groups, error } = await supabaseAdmin.schema('ondwira').from('work_groups')
    .select('id, conversation_id').eq('organization_id', input.organizationId)
    .eq('auto_membership', true).is('archived_at', null);
  if (error) throw error;
  if (!groups?.length) return;
  const now = new Date().toISOString();
  const { error: groupError } = await supabaseAdmin.schema('ondwira').from('work_group_members').upsert(
    groups.map((group: { id: string; conversation_id: string | null }) => ({
      group_id: group.id,
      user_id: input.userId,
      role: 'member',
      membership_source: 'organization',
      joined_at: now,
      removed_at: null,
    })),
    { onConflict: 'group_id,user_id' },
  );
  if (groupError) throw groupError;
  const conversations = groups.filter((group: { id: string; conversation_id: string | null }) => group.conversation_id);
  if (!conversations.length) return;
  const { error: conversationError } = await supabaseAdmin.schema('ondwira').from('conversation_members').upsert(
    conversations.map((group: { id: string; conversation_id: string | null }) => ({
      conversation_id: group.conversation_id,
      user_id: input.userId,
      account_type: input.accountType,
      role: 'member',
      membership_status: 'accepted',
    })),
    { onConflict: 'conversation_id,user_id' },
  );
  if (conversationError) throw conversationError;
}

export async function removeOrganizationAccess(organizationId: string, userId: string) {
  const { data: groups, error } = await supabaseAdmin.schema('ondwira').from('work_groups')
    .select('id, conversation_id').eq('organization_id', organizationId).is('archived_at', null);
  if (error) throw error;
  if (!groups?.length) return;
  const now = new Date().toISOString();
  const groupIds = groups.map((group: { id: string; conversation_id: string | null }) => group.id);
  const { error: groupError } = await supabaseAdmin.schema('ondwira').from('work_group_members')
    .update({ removed_at: now }).in('group_id', groupIds).eq('user_id', userId).is('removed_at', null);
  if (groupError) throw groupError;
  const conversationIds = groups.map((group: { id: string; conversation_id: string | null }) => group.conversation_id).filter(Boolean) as string[];
  if (!conversationIds.length) return;
  const { error: conversationError } = await supabaseAdmin.schema('ondwira').from('conversation_members')
    .update({ membership_status: 'removed' }).in('conversation_id', conversationIds).eq('user_id', userId);
  if (conversationError) throw conversationError;
}
