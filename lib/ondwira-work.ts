import { supabaseAdmin } from '@/lib/supabase';

type EmploymentSyncInput = {
  applicationId: string;
  companyId: string;
  companyName: string;
  professionalId: string;
  jobId: string;
  jobTitle: string;
  status: 'employed' | 'terminated';
};

/**
 * Mirrors a verified legacy employment transition into Ondwira. This is kept
 * idempotent so legacy retries cannot create duplicate organisations or groups.
 */
export async function syncOndwiraEmployment(input: EmploymentSyncInput) {
  const { data: existingOrganization } = await supabaseAdmin.schema('ondwira').from('organizations')
    .select('id').eq('legacy_company_id', input.companyId).maybeSingle();

  let organizationId = existingOrganization?.id as string | undefined;
  if (!organizationId) {
    const { data, error } = await supabaseAdmin.schema('ondwira').from('organizations').insert({
      legacy_company_id: input.companyId,
      name: input.companyName,
      created_by: input.companyId,
    }).select('id').single();
    if (error || !data) throw error || new Error('Unable to create Ondwira organisation');
    organizationId = data.id;
  }

  await supabaseAdmin.schema('ondwira').from('organization_members').upsert({
    organization_id: organizationId, user_id: input.companyId, account_type: 'employer', role: 'owner', status: 'active', joined_at: new Date().toISOString(), ended_at: null,
  }, { onConflict: 'organization_id,user_id' });

  const isActive = input.status === 'employed';
  await supabaseAdmin.schema('ondwira').from('organization_members').upsert({
    organization_id: organizationId,
    user_id: input.professionalId,
    account_type: 'professional',
    role: 'member',
    status: isActive ? 'active' : 'removed',
    joined_at: isActive ? new Date().toISOString() : undefined,
    ended_at: isActive ? null : new Date().toISOString(),
  }, { onConflict: 'organization_id,user_id' });

  const { data: existingGroup } = await supabaseAdmin.schema('ondwira').from('work_groups')
    .select('id, conversation_id').eq('organization_id', organizationId).eq('group_type', 'company').is('archived_at', null).maybeSingle();
  let group = existingGroup;

  if (!group) {
    const { data: conversation, error: conversationError } = await supabaseAdmin.schema('ondwira').from('conversations').insert({
      kind: 'group', context: 'work', title: `${input.companyName} team`, created_by: input.companyId,
    }).select('id').single();
    if (conversationError || !conversation) throw conversationError || new Error('Unable to create company conversation');
    await supabaseAdmin.schema('ondwira').from('conversation_members').insert({
      conversation_id: conversation.id, user_id: input.companyId, account_type: 'employer', role: 'owner', membership_status: 'accepted',
    });
    const { data: createdGroup, error: groupError } = await supabaseAdmin.schema('ondwira').from('work_groups').insert({
      organization_id: organizationId, conversation_id: conversation.id, name: `${input.companyName} team`, group_type: 'company', auto_membership: true, created_by: input.companyId,
    }).select('id, conversation_id').single();
    if (groupError || !createdGroup) throw groupError || new Error('Unable to create company group');
    group = createdGroup;
  }

  await supabaseAdmin.schema('ondwira').from('work_group_members').upsert({
    group_id: group.id, user_id: input.professionalId, role: 'member', membership_source: 'employment', source_id: input.applicationId,
    joined_at: new Date().toISOString(), removed_at: isActive ? null : new Date().toISOString(),
  }, { onConflict: 'group_id,user_id' });
  if (group.conversation_id) {
    await supabaseAdmin.schema('ondwira').from('conversation_members').upsert({
      conversation_id: group.conversation_id, user_id: input.professionalId, account_type: 'professional', role: 'member', membership_status: isActive ? 'accepted' : 'removed',
    }, { onConflict: 'conversation_id,user_id' });
  }

  await supabaseAdmin.schema('ondwira').from('employment_records').upsert({
    user_id: input.professionalId,
    organization_id: organizationId,
    legacy_application_id: input.applicationId,
    job_id: input.jobId,
    title: input.jobTitle,
    status: isActive ? 'active' : 'terminated',
    started_at: isActive ? new Date().toISOString().slice(0, 10) : undefined,
    ended_at: isActive ? null : new Date().toISOString().slice(0, 10),
    source: 'application',
    updated_at: new Date().toISOString(),
  }, { onConflict: 'legacy_application_id' });
}
